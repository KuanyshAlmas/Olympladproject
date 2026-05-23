import os
import time

from django.conf import settings

from .models import AssistantMessage


class GeminiAssistantError(Exception):
    pass


TRANSIENT_ERROR_MARKERS = (
    '503',
    'UNAVAILABLE',
    'high demand',
    'overloaded',
    'temporarily unavailable',
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
    primary_model = os.environ.get('GEMINI_MODEL', getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash'))
    fallback_models = os.environ.get('GEMINI_FALLBACK_MODELS', 'gemini-2.5-flash-lite,gemini-2.0-flash')
    models = [primary_model]
    models.extend(model.strip() for model in fallback_models.split(',') if model.strip())

    unique_models = []
    for model in models:
        if model not in unique_models:
            unique_models.append(model)
    return unique_models


def is_transient_gemini_error(exc):
    message = str(exc)
    return any(marker.lower() in message.lower() for marker in TRANSIENT_ERROR_MARKERS)


def build_contents(thread):
    try:
        from google.genai import types
    except ImportError as exc:
        raise GeminiAssistantError('Gemini SDK орнатылмаған. requirements.txt ішіндегі google-genai dependency керек.') from exc

    contents = []
    messages = list(thread.messages.order_by('created_at'))
    first_user_index = next(
        (index for index, message in enumerate(messages) if message.role == AssistantMessage.Role.USER),
        len(messages),
    )
    messages = messages[first_user_index:][-18:]
    for message in messages:
        role = 'model' if message.role == AssistantMessage.Role.ASSISTANT else 'user'
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=message.content)],
            )
        )
    return contents


def generate_assistant_reply(thread):
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        raise GeminiAssistantError('ИИ сервисі әлі бапталмаған. GEMINI_API_KEY керек.')

    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise GeminiAssistantError('Gemini SDK орнатылмаған. requirements.txt ішіндегі google-genai dependency керек.') from exc

    client = genai.Client(api_key=api_key)
    try:
        contents = build_contents(thread)
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT.strip(),
            temperature=0.35,
            max_output_tokens=1800,
        )

        last_transient_error = None
        for model in get_model_candidates():
            for attempt in range(2):
                try:
                    response = client.models.generate_content(
                        model=model,
                        contents=contents,
                        config=config,
                    )
                    text = (getattr(response, 'text', '') or '').strip()
                    if not text:
                        raise GeminiAssistantError('Gemini бос жауап қайтарды. Кейінірек қайталап көріңіз.')
                    return text
                except GeminiAssistantError:
                    raise
                except Exception as exc:
                    if not is_transient_gemini_error(exc):
                        raise GeminiAssistantError('Gemini жауап бере алмады. API key, quota немесе model атауын тексеріңіз.') from exc
                    last_transient_error = exc
                    if attempt == 0:
                        time.sleep(0.7)

        raise GeminiAssistantError(
            'Gemini қазір көп сұранысқа байланысты жауап бере алмай тұр. Бірнеше минуттан кейін қайта көріңіз.'
        ) from last_transient_error
    except GeminiAssistantError:
        raise
    except Exception as exc:
        raise GeminiAssistantError('Gemini жауап бере алмады. Кейінірек қайта көріңіз.') from exc
    finally:
        close = getattr(client, 'close', None)
        if close:
            close()
