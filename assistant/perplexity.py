import json
import os
import socket
import time
import urllib.error
import urllib.request

from django.conf import settings

from .models import AssistantMessage


class PerplexityAssistantError(Exception):
    pass


class PerplexityAPIError(Exception):
    def __init__(self, message, status_code=None):
        super().__init__(message)
        self.status_code = status_code


PERPLEXITY_API_URL = 'https://api.perplexity.ai/v1/sonar'

TRANSIENT_STATUS_CODES = {408, 409, 425, 429, 500, 502, 503, 504}
TRANSIENT_ERROR_MARKERS = (
    'timeout',
    'temporarily unavailable',
    'connection',
    'rate limit',
    'too many requests',
    'overloaded',
    'unavailable',
)


SYSTEM_PROMPT = """
Сен QyranCode платформасының ИИ ассистентісің.
Әңгімені әрқашан қазақ тілінде баста және негізгі жауапты қазақша бер.
Оқушы түсінбей қалған информатика, алгоритм, бағдарламалау, робототехника тақырыптарын қарапайым тілмен түсіндір.
QyranCode сайтын қолдану туралы сұраса, нақты бөлімдерді түсіндір:
Dashboard - жалпы прогресс пен тапсырмалар;
Бағдарлама - оқу жоспары мен сабақтар;
Codeforces - есептер, шарт, код жазу және іске қосу;
Прогресс - дағдылар мен даму деңгейі;
Оқушылар - мұғалімдерге оқушы тізімі;
Есептер - оқу нәтижелері;
Жол картасы - тақырыптарды кезеңмен оқу.
Егер сұрақ түсініксіз болса, қысқа нақтылау сұра.
Жауапты қысқа, пайдалы, достық стильде бер. Дайын үй жұмысын толық көшіріп бермей, түсіндіру мен бағыт беруге басымдық бер.
Жауапты жарты жолда үзбе: ойды толық аяқтап, соңында келесі нақты қадамды айт.
"""


def get_model_candidates():
    primary_model = os.environ.get(
        'PERPLEXITY_MODEL',
        getattr(settings, 'PERPLEXITY_MODEL', 'sonar'),
    ) or 'sonar'
    fallback_models = os.environ.get(
        'PERPLEXITY_FALLBACK_MODELS',
        getattr(settings, 'PERPLEXITY_FALLBACK_MODELS', ''),
    )
    models = [primary_model]
    models.extend(model.strip() for model in str(fallback_models).split(',') if model.strip())

    unique_models = []
    for model in models:
        if model and model not in unique_models:
            unique_models.append(model)
    return unique_models


def get_timeout():
    raw_timeout = os.environ.get('PERPLEXITY_TIMEOUT', getattr(settings, 'PERPLEXITY_TIMEOUT', 30))
    try:
        return max(1, float(raw_timeout))
    except (TypeError, ValueError):
        return 30


def is_transient_perplexity_error(exc):
    status_code = getattr(exc, 'status_code', None)
    if status_code in TRANSIENT_STATUS_CODES:
        return True

    message = str(exc)
    return any(marker in message.lower() for marker in TRANSIENT_ERROR_MARKERS)


def build_messages(thread):
    messages = [{'role': 'system', 'content': SYSTEM_PROMPT.strip()}]
    thread_messages = list(thread.messages.order_by('created_at'))
    first_user_index = next(
        (index for index, message in enumerate(thread_messages) if message.role == AssistantMessage.Role.USER),
        len(thread_messages),
    )
    thread_messages = thread_messages[first_user_index:][-18:]

    for message in thread_messages:
        role = 'assistant' if message.role == AssistantMessage.Role.ASSISTANT else 'user'
        messages.append({'role': role, 'content': message.content})
    return messages


def extract_error_detail(body):
    if not body:
        return ''

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return body[:300]

    error = payload.get('error')
    if isinstance(error, dict):
        return error.get('message') or error.get('detail') or json.dumps(error, ensure_ascii=False)[:300]
    if isinstance(error, str):
        return error
    return json.dumps(payload, ensure_ascii=False)[:300]


def post_sonar(payload, api_key, api_url, timeout):
    request = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode('utf-8')
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode('utf-8', errors='replace')
        detail = extract_error_detail(error_body)
        message = f'HTTP {exc.code}'
        if detail:
            message = f'{message}: {detail}'
        raise PerplexityAPIError(message, status_code=exc.code) from exc
    except (urllib.error.URLError, TimeoutError, socket.timeout) as exc:
        raise PerplexityAPIError(str(exc)) from exc

    try:
        return json.loads(body)
    except json.JSONDecodeError as exc:
        raise PerplexityAPIError('Perplexity JSON емес жауап қайтарды.') from exc


def extract_response_text(response):
    choices = response.get('choices') or []
    if not choices:
        return ''

    message = (choices[0] or {}).get('message') or {}
    content = message.get('content')
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, dict):
                parts.append(part.get('text') or '')
            else:
                parts.append(str(part))
        return ''.join(parts).strip()
    return ''


def generate_assistant_reply(thread):
    api_key = os.environ.get('PERPLEXITY_API_KEY')
    if not api_key:
        raise PerplexityAssistantError('ИИ сервисі әлі бапталмаған. PERPLEXITY_API_KEY керек.')

    api_url = os.environ.get(
        'PERPLEXITY_API_URL',
        getattr(settings, 'PERPLEXITY_API_URL', PERPLEXITY_API_URL),
    )
    timeout = get_timeout()
    messages = build_messages(thread)

    last_transient_error = None
    for model in get_model_candidates():
        payload = {
            'model': model,
            'messages': messages,
            'temperature': 0.35,
            'max_tokens': 1800,
        }
        for attempt in range(2):
            try:
                response = post_sonar(payload, api_key, api_url, timeout)
                text = extract_response_text(response)
                if not text:
                    raise PerplexityAssistantError('Perplexity бос жауап қайтарды. Кейінірек қайталап көріңіз.')
                return text
            except PerplexityAssistantError:
                raise
            except Exception as exc:
                if not is_transient_perplexity_error(exc):
                    raise PerplexityAssistantError(
                        'Perplexity жауап бере алмады. API key, quota немесе model атауын тексеріңіз.'
                    ) from exc
                last_transient_error = exc
                if attempt == 0:
                    time.sleep(0.7)

    raise PerplexityAssistantError(
        'Perplexity қазір көп сұранысқа байланысты жауап бере алмай тұр. Бірнеше минуттан кейін қайта көріңіз.'
    ) from last_transient_error
