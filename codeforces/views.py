import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from html import escape
from html.parser import HTMLParser

from django.core.cache import cache
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import is_platform_admin
from core.models import UserRole

from .models import CodeforcesProblemStatement, CodeforcesSolution
from .serializers import CodeforcesSolutionSerializer


CODEFORCES_API_URL = 'https://codeforces.com/api/problemset.problems'
CODEFORCES_BASE_URL = 'https://codeforces.com'
RUN_TIMEOUT_SECONDS = 5
COMPILE_TIMEOUT_SECONDS = 10
MAX_CODE_LENGTH = 50000
MAX_INPUT_LENGTH = 20000
MAX_OUTPUT_LENGTH = 20000

CPP_BITS_HEADER = '''
#pragma once
#include <algorithm>
#include <array>
#include <bitset>
#include <cassert>
#include <cctype>
#include <cerrno>
#include <cfloat>
#include <chrono>
#include <climits>
#include <cmath>
#include <complex>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <deque>
#include <exception>
#include <fstream>
#include <functional>
#include <iomanip>
#include <iostream>
#include <iterator>
#include <limits>
#include <list>
#include <map>
#include <memory>
#include <numeric>
#include <queue>
#include <random>
#include <regex>
#include <set>
#include <sstream>
#include <stack>
#include <stdexcept>
#include <string>
#include <tuple>
#include <typeinfo>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
'''

FALLBACK_PROBLEMS = [
    {
        'contestId': 4,
        'index': 'A',
        'name': 'Watermelon',
        'rating': 800,
        'tags': ['brute force', 'math'],
        'solvedCount': 600000,
    },
    {
        'contestId': 71,
        'index': 'A',
        'name': 'Way Too Long Words',
        'rating': 800,
        'tags': ['strings'],
        'solvedCount': 500000,
    },
    {
        'contestId': 158,
        'index': 'A',
        'name': 'Next Round',
        'rating': 800,
        'tags': ['implementation'],
        'solvedCount': 450000,
    },
    {
        'contestId': 231,
        'index': 'A',
        'name': 'Team',
        'rating': 800,
        'tags': ['brute force', 'greedy'],
        'solvedCount': 430000,
    },
]

FALLBACK_STATEMENTS = {
    (4, 'A'): (
        'Қарбыз\n\n'
        'Бір бүтін w саны берілген. Қарбызды екі оң бөлікке бөліп, '
        'әр бөліктің салмағы жұп бола ала ма, соны анықтау керек.\n\n'
        'Кіріс деректері\n'
        'Бір бүтін w саны.\n\n'
        'Шығыс деректері\n'
        'Егер мұндай бөлу мүмкін болса YES, әйтпесе NO шығарыңыз.'
    ),
    (71, 'A'): (
        'Өте ұзын сөздер\n\n'
        'Егер сөз 10 таңбадан ұзын болса, оны қысқарту керек: '
        'бірінші әріп, алып тасталған ортадағы әріптер саны және соңғы әріп. '
        'Қысқа сөздер өзгеріссіз қалады.\n\n'
        'Кіріс деректері\n'
        'Бірінші жолда n берілген. Келесі n жолдың әрқайсысында бір сөз жазылған.\n\n'
        'Шығыс деректері\n'
        'Өңделген сөздерді әрқайсысын жаңа жолдан шығарыңыз.'
    ),
    (158, 'A'): (
        'Келесі раунд\n\n'
        'n қатысушы және олардың ұпайлары берілген. Қатысушының ұпайы оң болып, '
        'k-шы қатысушының ұпайынан кем болмаса, ол келесі раундқа өтеді.\n\n'
        'Кіріс деректері\n'
        'n және k, содан кейін өспейтін тәртіппен n ұпай берілген.\n\n'
        'Шығыс деректері\n'
        'Келесі раундқа өткен қатысушылар санын шығарыңыз.'
    ),
    (231, 'A'): (
        'Команда\n\n'
        'Әр есеп үшін команданың үш қатысушысы шешімге сенімді ме, соны айтады. '
        'Кемінде екі қатысушы сенімді болса, команда есепті шығарады.\n\n'
        'Кіріс деректері\n'
        'Бірінші жолда n берілген. Келесі n жолдың әрқайсысында үш сан жазылған: 0 немесе 1.\n\n'
        'Шығыс деректері\n'
        'Команда шығаратын есептер санын шығарыңыз.'
    ),
}


ALLOWED_STATEMENT_TAGS = {
    'a', 'b', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'hr', 'i',
    'img', 'li', 'ol', 'p', 'pre', 'span', 'strong', 'sub', 'sup', 'table',
    'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
}


class ProblemStatementParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.capture_depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        class_names = attrs_dict.get('class', '')

        if self.capture_depth == 0:
            if tag == 'div' and 'problem-statement' in class_names.split():
                self.capture_depth = 1
            return

        if tag == 'div':
            self.capture_depth += 1

        if tag not in ALLOWED_STATEMENT_TAGS:
            return

        safe_attrs = self.safe_attrs(tag, attrs_dict)
        attr_text = ''.join(
            f' {name}="{escape(value, quote=True)}"'
            for name, value in safe_attrs.items()
            if value
        )
        self.parts.append(f'<{tag}{attr_text}>')

    def handle_endtag(self, tag):
        if self.capture_depth == 0:
            return

        if tag == 'div':
            if self.capture_depth == 1:
                self.capture_depth = 0
                return
            self.capture_depth -= 1

        if tag in ALLOWED_STATEMENT_TAGS and tag not in {'br', 'hr', 'img'}:
            self.parts.append(f'</{tag}>')

    def handle_data(self, data):
        if self.capture_depth:
            self.parts.append(escape(data))

    def handle_entityref(self, name):
        if self.capture_depth:
            self.parts.append(f'&{name};')

    def handle_charref(self, name):
        if self.capture_depth:
            self.parts.append(f'&#{name};')

    def safe_attrs(self, tag, attrs):
        safe = {}
        class_name = attrs.get('class', '')
        if class_name:
            safe['class'] = re.sub(r'[^a-zA-Z0-9_\- ]', '', class_name)

        if tag == 'a':
            href = attrs.get('href', '')
            if href.startswith('/'):
                href = f'{CODEFORCES_BASE_URL}{href}'
            if href.startswith(('http://', 'https://')):
                safe['href'] = href
                safe['target'] = '_blank'
                safe['rel'] = 'noreferrer'

        if tag == 'img':
            src = attrs.get('src', '')
            if src.startswith('/'):
                src = f'{CODEFORCES_BASE_URL}{src}'
            if src.startswith(('http://', 'https://')):
                safe['src'] = src
                safe['alt'] = attrs.get('alt', 'Problem image')

        return safe

    def statement_html(self):
        return ''.join(self.parts).strip()


def fetch_codeforces_problemset(tags=''):
    cache_key = f"codeforces:problemset:{tags or 'all'}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    params = {}
    if tags:
        params['tags'] = tags
    url = CODEFORCES_API_URL
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"

    request = urllib.request.Request(
        url,
        headers={'User-Agent': 'QyranCode-CRM/1.0'}
    )

    with urllib.request.urlopen(request, timeout=8) as response:
        payload = json.loads(response.read().decode('utf-8'))

    if payload.get('status') != 'OK':
        raise ValueError(payload.get('comment') or 'Codeforces API error')

    stats = {
        (item.get('contestId'), item.get('index')): item.get('solvedCount', 0)
        for item in payload['result'].get('problemStatistics', [])
    }
    problems = []
    for problem in payload['result'].get('problems', []):
        contest_id = problem.get('contestId')
        index = problem.get('index')
        if not contest_id or not index:
            continue
        problems.append({
            'contestId': contest_id,
            'index': index,
            'name': problem.get('name', ''),
            'rating': problem.get('rating'),
            'tags': problem.get('tags', []),
            'solvedCount': stats.get((contest_id, index), 0),
        })

    cache.set(cache_key, problems, 60 * 30)
    return problems


def build_problem_url(contest_id, index):
    return f"{CODEFORCES_BASE_URL}/problemset/problem/{contest_id}/{index}"


def build_submit_url(contest_id, index):
    return f"{CODEFORCES_BASE_URL}/problemset/submit/{contest_id}/{index}"


def statement_text_to_html(statement_text):
    paragraphs = re.split(r'\n\s*\n', statement_text.strip())
    html_parts = []
    for paragraph in paragraphs:
        safe_paragraph = escape(paragraph.strip()).replace('\n', '<br>')
        if safe_paragraph:
            html_parts.append(f'<p>{safe_paragraph}</p>')
    return ''.join(html_parts)


def statement_response_payload(source, contest_id, index, statement_text, name=''):
    return {
        'source': source,
        'contestId': int(contest_id),
        'index': str(index),
        'name': name,
        'problemUrl': build_problem_url(contest_id, index),
        'statementText': statement_text,
        'statementHtml': statement_text_to_html(statement_text),
    }


def truncate_output(value):
    if len(value) <= MAX_OUTPUT_LENGTH:
        return value
    return f'{value[:MAX_OUTPUT_LENGTH]}\n\n[output truncated]'


def normalize_runner_language(language):
    lower = language.lower()
    if 'c++20' in lower:
        return 'cpp20'
    if 'c++' in lower or 'gnu' in lower:
        return 'cpp17'
    if 'java' in lower:
        return 'java'
    if 'pypy' in lower:
        return 'pypy'
    if 'python' in lower:
        return 'python'
    return ''


def run_process(command, stdin_text='', cwd=None, timeout=RUN_TIMEOUT_SECONDS):
    return subprocess.run(
        command,
        input=stdin_text,
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )


def missing_tool_message(tool_name):
    return (
        f'{tool_name} компиляторы серверде табылмады. '
        'Әкімшіге Docker image ішіне компилятор орнату керек.'
    )


def fetch_codeforces_statement(contest_id, index):
    cache_key = f'codeforces:statement:{contest_id}:{index}'
    cached = cache.get(cache_key)
    if cached:
        return cached

    url = f'{build_problem_url(contest_id, index)}?locale=ru'
    request = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'QyranCode-CRM/1.0',
            'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.7',
        },
    )

    with urllib.request.urlopen(request, timeout=8) as response:
        page = response.read().decode('utf-8', errors='replace')

    parser = ProblemStatementParser()
    parser.feed(page)
    statement_html = parser.statement_html()
    if not statement_html:
        raise ValueError('Есеп шарты табылмады')

    payload = {
        'source': 'codeforces',
        'contestId': int(contest_id),
        'index': str(index),
        'name': '',
        'problemUrl': build_problem_url(contest_id, index),
        'statementText': '',
        'statementHtml': statement_html,
    }
    cache.set(cache_key, payload, 60 * 60 * 12)
    return payload


class CodeforcesProblemListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        search = request.query_params.get('search', '').strip().lower()
        tags = request.query_params.get('tags', '').strip()
        min_rating = request.query_params.get('min_rating')
        max_rating = request.query_params.get('max_rating')
        limit = min(int(request.query_params.get('limit', 80)), 200)

        try:
            problems = fetch_codeforces_problemset(tags=tags.replace(',', ';'))
            source = 'codeforces'
        except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError):
            problems = FALLBACK_PROBLEMS
            source = 'fallback'

        if search:
            problems = [
                problem for problem in problems
                if search in problem['name'].lower()
                or search in f"{problem['contestId']}{problem['index']}".lower()
            ]

        if min_rating:
            min_value = int(min_rating)
            problems = [
                problem for problem in problems
                if problem.get('rating') and problem['rating'] >= min_value
            ]

        if max_rating:
            max_value = int(max_rating)
            problems = [
                problem for problem in problems
                if problem.get('rating') and problem['rating'] <= max_value
            ]

        problems = sorted(
            problems,
            key=lambda problem: (
                problem.get('rating') or 9999,
                -problem.get('solvedCount', 0),
                problem.get('contestId', 0),
                problem.get('index', ''),
            )
        )[:limit]

        for problem in problems:
            problem['problemUrl'] = build_problem_url(problem['contestId'], problem['index'])
            problem['submitUrl'] = build_submit_url(problem['contestId'], problem['index'])

        return Response({
            'source': source,
            'count': len(problems),
            'problems': problems,
        })


class CodeforcesProblemStatementView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, contest_id, index):
        local_statement = CodeforcesProblemStatement.objects.filter(
            contest_id=contest_id,
            index=index,
        ).first()
        if local_statement:
            return Response(statement_response_payload(
                'local',
                contest_id,
                index,
                local_statement.statement_text,
                local_statement.name,
            ))

        try:
            return Response(fetch_codeforces_statement(contest_id, index))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError):
            fallback_text = FALLBACK_STATEMENTS.get((contest_id, index))
            if fallback_text:
                return Response(statement_response_payload(
                    'demo',
                    contest_id,
                    index,
                    fallback_text,
                ))

            problem_url = build_problem_url(contest_id, index)
            return Response({
                'source': 'unavailable',
                'contestId': int(contest_id),
                'index': str(index),
                'name': '',
                'problemUrl': problem_url,
                'statementText': '',
                'statementHtml': (
                    '<div class="statement-unavailable">'
                    '<p>Есеп шартын қазір Codeforces-тен жүктеу мүмкін болмады.</p>'
                    f'<p><a href="{escape(problem_url, quote=True)}" target="_blank" rel="noreferrer">'
                    'Есептің түпнұсқасын ашу</a></p>'
                    '</div>'
                ),
            })

    def put(self, request, contest_id, index):
        return self.save_statement(request, contest_id, index)

    def patch(self, request, contest_id, index):
        return self.save_statement(request, contest_id, index)

    def save_statement(self, request, contest_id, index):
        if not is_platform_admin(request.user):
            return Response(
                {'detail': 'Codeforces есеп шартын тек әкімші өзгерте алады.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        statement_text = request.data.get('statement_text', '').strip()
        if not statement_text:
            return Response(
                {'statement_text': 'Бұл өріс міндетті.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        statement, _ = CodeforcesProblemStatement.objects.update_or_create(
            contest_id=contest_id,
            index=index,
            defaults={
                'name': request.data.get('name', '').strip(),
                'statement_text': statement_text,
                'updated_by': request.user,
            },
        )
        cache.delete(f'codeforces:statement:{contest_id}:{index}')
        return Response(statement_response_payload(
            'local',
            contest_id,
            index,
            statement.statement_text,
            statement.name,
        ))


class CodeforcesRunCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '')
        stdin_text = request.data.get('stdin', '')
        language = request.data.get('language', '')

        if not isinstance(code, str) or not code.strip():
            return Response({'code': 'Код міндетті.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(code) > MAX_CODE_LENGTH:
            return Response(
                {'code': f'Код тым ұзын. Ең көбі {MAX_CODE_LENGTH} таңба.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(stdin_text, str):
            return Response({'stdin': 'Кіріс деректері мәтін болуы керек.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(stdin_text) > MAX_INPUT_LENGTH:
            return Response(
                {'stdin': f'Кіріс деректері тым ұзын. Ең көбі {MAX_INPUT_LENGTH} таңба.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        runner_language = normalize_runner_language(language)
        if runner_language not in {'cpp17', 'cpp20', 'python', 'pypy', 'java'}:
            return Response(
                {'language': 'Қолдау көрсетілетін тілдер: GNU C++17, GNU C++20, Python 3, PyPy 3, Java 17.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        started_at = time.monotonic()
        try:
            with tempfile.TemporaryDirectory(prefix='qyrancode_code_') as temp_dir:
                return Response(self.execute_code(runner_language, code, stdin_text, temp_dir, started_at))
        except subprocess.TimeoutExpired as exc:
            return Response({
                'ok': False,
                'phase': 'run',
                'exit_code': None,
                'stdout': truncate_output(exc.stdout or ''),
                'stderr': truncate_output(exc.stderr or 'Уақыт шегі асып кетті.'),
                'compile_output': '',
                'timed_out': True,
                'duration_ms': round((time.monotonic() - started_at) * 1000),
            })
        except OSError as exc:
            return Response({
                'ok': False,
                'phase': 'system',
                'exit_code': None,
                'stdout': '',
                'stderr': str(exc),
                'compile_output': '',
                'timed_out': False,
                'duration_ms': round((time.monotonic() - started_at) * 1000),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def execute_code(self, runner_language, code, stdin_text, temp_dir, started_at):
        compile_output = ''

        if runner_language in {'cpp17', 'cpp20'}:
            if not shutil.which('g++'):
                return self.build_result(
                    ok=False,
                    phase='system',
                    exit_code=None,
                    stdout='',
                    stderr=missing_tool_message('g++'),
                    compile_output='',
                    started_at=started_at,
                )
            source_path = f'{temp_dir}/main.cpp'
            binary_path = f'{temp_dir}/main'
            os.makedirs(f'{temp_dir}/bits', exist_ok=True)
            with open(f'{temp_dir}/bits/stdc++.h', 'w', encoding='utf-8') as bits_file:
                bits_file.write(CPP_BITS_HEADER)
            with open(source_path, 'w', encoding='utf-8') as source_file:
                source_file.write(code)
            standard = 'c++20' if runner_language == 'cpp20' else 'c++17'
            compile_result = run_process(
                ['g++', f'-std={standard}', '-O2', '-pipe', f'-I{temp_dir}', source_path, '-o', binary_path],
                cwd=temp_dir,
                timeout=COMPILE_TIMEOUT_SECONDS,
            )
            compile_output = truncate_output(compile_result.stdout + compile_result.stderr)
            if compile_result.returncode != 0:
                return self.build_result(
                    ok=False,
                    phase='compile',
                    exit_code=compile_result.returncode,
                    stdout='',
                    stderr='',
                    compile_output=compile_output,
                    started_at=started_at,
                )
            command = [binary_path]

        elif runner_language in {'python', 'pypy'}:
            source_path = f'{temp_dir}/solution.py'
            with open(source_path, 'w', encoding='utf-8') as source_file:
                source_file.write(code)
            interpreter = shutil.which('pypy3') if runner_language == 'pypy' else None
            if runner_language == 'pypy' and not interpreter:
                return self.build_result(
                    ok=False,
                    phase='system',
                    exit_code=None,
                    stdout='',
                    stderr=missing_tool_message('pypy3'),
                    compile_output='',
                    started_at=started_at,
                )
            command = [interpreter or sys.executable, source_path]

        else:
            if not shutil.which('javac') or not shutil.which('java'):
                return self.build_result(
                    ok=False,
                    phase='system',
                    exit_code=None,
                    stdout='',
                    stderr=missing_tool_message('Java 17'),
                    compile_output='',
                    started_at=started_at,
                )
            source_path = f'{temp_dir}/Main.java'
            with open(source_path, 'w', encoding='utf-8') as source_file:
                source_file.write(code)
            compile_result = run_process(
                ['javac', source_path],
                cwd=temp_dir,
                timeout=COMPILE_TIMEOUT_SECONDS,
            )
            compile_output = truncate_output(compile_result.stdout + compile_result.stderr)
            if compile_result.returncode != 0:
                return self.build_result(
                    ok=False,
                    phase='compile',
                    exit_code=compile_result.returncode,
                    stdout='',
                    stderr='',
                    compile_output=compile_output,
                    started_at=started_at,
                )
            command = ['java', '-cp', temp_dir, 'Main']

        run_result = run_process(command, stdin_text=stdin_text, cwd=temp_dir)
        return self.build_result(
            ok=run_result.returncode == 0,
            phase='run',
            exit_code=run_result.returncode,
            stdout=truncate_output(run_result.stdout),
            stderr=truncate_output(run_result.stderr),
            compile_output=compile_output,
            started_at=started_at,
        )

    def build_result(self, ok, phase, exit_code, stdout, stderr, compile_output, started_at):
        return {
            'ok': ok,
            'phase': phase,
            'exit_code': exit_code,
            'stdout': stdout,
            'stderr': stderr,
            'compile_output': compile_output,
            'timed_out': False,
            'duration_ms': round((time.monotonic() - started_at) * 1000),
        }


class CodeforcesSolutionViewSet(viewsets.ModelViewSet):
    serializer_class = CodeforcesSolutionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = CodeforcesSolution.objects.select_related('user')

        if is_platform_admin(user):
            return queryset

        if user.role == UserRole.LEADER:
            return queryset.filter(user__faction=user.faction)

        return queryset.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user_id != request.user.id:
            return Response(
                {'detail': 'Тек өз шешіміңізді өзгерте аласыз.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user_id != request.user.id:
            return Response(
                {'detail': 'Тек өз шешіміңізді өзгерте аласыз.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user_id != request.user.id:
            return Response(
                {'detail': 'Тек өз шешіміңізді өшіре аласыз.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)
