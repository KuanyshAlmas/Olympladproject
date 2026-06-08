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
DEFAULT_PERPLEXITY_MODEL = 'sonar'

TRANSIENT_STATUS_CODES = {408, 409, 425, 429, 500, 502, 503, 504}
MODEL_ERROR_STATUS_CODES = {400, 404, 422}
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
        getattr(settings, 'PERPLEXITY_MODEL', DEFAULT_PERPLEXITY_MODEL),
    ) or DEFAULT_PERPLEXITY_MODEL
    fallback_models = os.environ.get(
        'PERPLEXITY_FALLBACK_MODELS',
        getattr(settings, 'PERPLEXITY_FALLBACK_MODELS', DEFAULT_PERPLEXITY_MODEL),
    )
    models = [primary_model]
    models.extend(model.strip() for model in str(fallback_models).split(',') if model.strip())
    models.append(DEFAULT_PERPLEXITY_MODEL)

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


def is_model_perplexity_error(exc):
    return getattr(exc, 'status_code', None) in MODEL_ERROR_STATUS_CODES


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
    if isinstance(payload.get('message'), str):
        return payload['message']
    if isinstance(payload.get('detail'), str):
        return payload['detail']
    return json.dumps(payload, ensure_ascii=False)[:300]


def get_api_key():
    for key_name in ('PERPLEXITY_API_KEY', 'PPLX_API_KEY', 'PERPLEXITYAI_API_KEY'):
        api_key = os.environ.get(key_name)
        if api_key and api_key.strip():
            return api_key.strip()
    return ''


def format_perplexity_error(exc, model):
    status_code = getattr(exc, 'status_code', None)
    detail = str(exc)
    suffix = f' ({detail})' if detail else ''

    if status_code in {401, 403}:
        return f'Perplexity API key дұрыс емес немесе API access жоқ. PERPLEXITY_API_KEY мәнін тексеріңіз.{suffix}'
    if status_code == 402:
        return f'Perplexity balance/quota жеткіліксіз. API Portal ішінде billing немесе credits тексеріңіз.{suffix}'
    if status_code == 429:
        return f'Perplexity rate limit/quota шегіне жетті. Бірнеше минуттан кейін қайталап көріңіз.{suffix}'
    if status_code in MODEL_ERROR_STATUS_CODES:
        return (
            f'Perplexity model/request қатесі. PERPLEXITY_MODEL=sonar қойып көріңіз. '
            f'Қазіргі model: {model}.{suffix}'
        )
    if status_code:
        return f'Perplexity HTTP {status_code} қатесін қайтарды.{suffix}'
    return f'Perplexity API-ға қосылу мүмкін болмады.{suffix}'


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
    api_key = get_api_key()
    if not api_key:
        raise PerplexityAssistantError('ИИ сервисі әлі бапталмаған. PERPLEXITY_API_KEY керек.')

    api_url = os.environ.get(
        'PERPLEXITY_API_URL',
        getattr(settings, 'PERPLEXITY_API_URL', PERPLEXITY_API_URL),
    )
    timeout = get_timeout()
    messages = build_messages(thread)

    last_transient_error = None
    last_model_error = None
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
                if is_model_perplexity_error(exc):
                    last_model_error = exc
                    break
                if not is_transient_perplexity_error(exc):
                    raise PerplexityAssistantError(format_perplexity_error(exc, model)) from exc
                last_transient_error = exc
                if attempt == 0:
                    time.sleep(0.7)

    if last_model_error:
        raise PerplexityAssistantError(format_perplexity_error(last_model_error, model)) from last_model_error

    if getattr(last_transient_error, 'status_code', None) == 429:
        raise PerplexityAssistantError(format_perplexity_error(last_transient_error, model)) from last_transient_error

    raise PerplexityAssistantError(
        'Perplexity қазір көп сұранысқа байланысты жауап бере алмай тұр. Бірнеше минуттан кейін қайта көріңіз.'
    ) from last_transient_error
