from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from codeforces.models import CodeforcesSolution
from core.models import Faction, PomodoroSession, User, UserRole
from gamification.models import Skill, UserSkill
from tasks.models import DailyStandup, Task, TaskStatus


PASSWORD = 'studentpass'
DEMO_DAYS_ELAPSED = 15

STUDENT_MAPPINGS = [
    ('aruzhan.serik', 'mendeke.ali', 'Мендеке', 'Али', Faction.INFORMATICS),
    ('madina.ermek', 'amenov.alem', 'Аменов', 'Алем', Faction.INFORMATICS),
    ('dana.marat', 'zhunusov.temirlan', 'Жунусов', 'Темірлан', Faction.INFORMATICS),
    ('tomiris.sagat', 'dastanuly.magzhan', 'Дастанұлы', 'Мағжан', Faction.INFORMATICS),
    ('erasil.talgat', 'maratov.ermek', 'Маратов', 'Ермек', Faction.INFORMATICS),
    ('ayaulym.bolat', 'gabrahman.sultan', 'Габрахман', 'Сұлтан', Faction.INFORMATICS),
    ('alina.rustem', 'rahan.olzhas', 'Рахан', 'Олжас', Faction.ROBOTICS),
    ('meruert.kai', 'zhanatov.elzhan', 'Жанатов', 'Елжан', Faction.ROBOTICS),
    ('zere.murat', 'abenov.sultan', 'Абенов', 'Сұлтан', Faction.ROBOTICS),
    ('kamila.arman', 'abilkaiyr.rauan', 'Әбілқайыр', 'Рауан', Faction.ROBOTICS),
    ('aisha.daniyar', 'musin.ahmet', 'Мусин', 'Ахмет', Faction.ROBOTICS),
    ('emir.tore', 'shanshar.zhambyl', 'Шаншар', 'Жамбыл', Faction.ROBOTICS),
]

TOP_STUDENT_RANKS = {
    username: rank
    for rank, (_, username, *_rest) in enumerate(STUDENT_MAPPINGS, start=1)
}

SKILLS = {
    Faction.INFORMATICS: [
        ('Binary Search', 'Search on sorted arrays and search by answer.'),
        ('Graph Theory', 'BFS, DFS, components and shortest paths.'),
        ('Dynamic Programming', 'State, transition and optimization basics.'),
        ('Number Theory', 'GCD, primes, sieve and modular arithmetic.'),
    ],
    Faction.ROBOTICS: [
        ('Arduino', 'Boards, pins, sensors and serial debugging.'),
        ('Sensors', 'Line, ultrasonic and color sensor calibration.'),
        ('PID Control', 'Control loop tuning for line follower robots.'),
        ('3D Printing', 'Designing and printing durable chassis parts.'),
    ],
}

CF_PROBLEMS = [
    (4, 'A', 'Watermelon', 800, ['math', 'brute force']),
    (71, 'A', 'Way Too Long Words', 800, ['strings']),
    (158, 'A', 'Next Round', 800, ['implementation']),
    (231, 'A', 'Team', 800, ['greedy']),
    (282, 'A', 'Bit++', 800, ['implementation']),
    (50, 'A', 'Domino piling', 800, ['math']),
    (263, 'A', 'Beautiful Matrix', 800, ['implementation']),
    (339, 'A', 'Helpful Maths', 800, ['sortings', 'strings']),
]

INFO_TASKS = [
    ('Binary Search practice', 'lower_bound, upper_bound және answer search бойынша 5 есеп.'),
    ('Prefix sums warmup', 'Бір өлшемді және екі өлшемді prefix sum қолдану.'),
    ('Graph BFS/DFS', 'Компоненттер, grid graph және қысқа жол есептері.'),
    ('Dynamic Programming basics', '1D DP, knapsack және LIS есептерін талдау.'),
]

ROBO_TASKS = [
    ('Arduino sensor calibration', 'Ақ/қара бетте датчик мәндерін өлшеп, кесте жасау.'),
    ('Line follower PID tuning', 'P, I, D коэффициенттерін тест трассада реттеу.'),
    ('Chassis stability check', 'Дөңгелек, мотор бекітпесі және центр массасын тексеру.'),
    ('Ultrasonic obstacle mode', 'Кедергіні анықтау және тоқтау алгоритмін жазу.'),
]


def sample_code(contest_id, index):
    if (contest_id, index) == (4, 'A'):
        return (
            '#include <bits/stdc++.h>\n'
            'using namespace std;\n\n'
            'int main() {\n'
            '    int w;\n'
            '    cin >> w;\n'
            '    cout << (w > 2 && w % 2 == 0 ? "YES" : "NO");\n'
            '}\n'
        )
    return (
        '#include <bits/stdc++.h>\n'
        'using namespace std;\n\n'
        'int main() {\n'
        '    ios::sync_with_stdio(false);\n'
        '    cin.tie(nullptr);\n'
        '    return 0;\n'
        '}\n'
    )


class Command(BaseCommand):
    help = 'Synchronize existing demo student accounts with the current Olymplad demo roster.'

    def add_arguments(self, parser):
        parser.add_argument('--noinput', action='store_true', help='Accepted for Railway startup compatibility.')

    @transaction.atomic
    def handle(self, *args, **options):
        synced = []
        for old_username, username, first_name, last_name, faction in STUDENT_MAPPINGS:
            user = self.get_or_create_student(old_username, username)
            self.update_identity(user, username, first_name, last_name, faction)
            self.ensure_top_progress(user)
            synced.append(username)

        self.stdout.write(self.style.SUCCESS(f'Synced demo top students: {len(synced)}'))

    def get_or_create_student(self, old_username, username):
        target = User.objects.filter(username=username).first()
        old = User.objects.filter(username=old_username).first()

        if target and old and target.id != old.id:
            old.delete()
            return target

        if target:
            return target

        if old:
            return old

        return User(username=username)

    def update_identity(self, user, username, first_name, last_name, faction):
        user.username = username
        user.email = f'{username}@olymplad.kz'
        user.first_name = first_name
        user.last_name = last_name
        user.role = UserRole.STUDENT
        user.faction = faction
        user.social_gpa = 5.0
        user.set_password(PASSWORD)
        user.save()

    def ensure_top_progress(self, user):
        self.ensure_skills(user)
        self.ensure_tasks(user)
        self.ensure_codeforces(user)
        self.ensure_pomodoro(user)
        self.ensure_standups(user)

    def ensure_skills(self, user):
        for name, description in SKILLS[user.faction]:
            skill, _ = Skill.objects.get_or_create(
                name=name,
                faction=user.faction,
                defaults={'description': description},
            )
            if not skill.description:
                skill.description = description
                skill.save(update_fields=['description'])
            UserSkill.objects.update_or_create(
                user=user,
                skill=skill,
                defaults={'level': UserSkill.Level.COMPLETED},
            )

    def ensure_tasks(self, user):
        source = INFO_TASKS if user.faction == Faction.INFORMATICS else ROBO_TASKS
        now = timezone.now()

        Task.objects.filter(assigned_to=user).update(status=TaskStatus.DONE, started_at=None)
        for offset, (title, description) in enumerate(source):
            Task.objects.update_or_create(
                title=f'{title} — {user.first_name}',
                assigned_to=user,
                defaults={
                    'description': description,
                    'faction': user.faction,
                    'status': TaskStatus.DONE,
                    'deadline': now - timedelta(days=max(1, DEMO_DAYS_ELAPSED - offset)),
                    'started_at': None,
                },
            )

    def ensure_codeforces(self, user):
        count = 8 if user.faction == Faction.INFORMATICS else 6
        for contest_id, problem_index, name, rating, tags in CF_PROBLEMS[:count]:
            CodeforcesSolution.objects.update_or_create(
                user=user,
                contest_id=contest_id,
                index=problem_index,
                defaults={
                    'name': name,
                    'rating': rating,
                    'tags': tags,
                    'status': CodeforcesSolution.Status.SOLVED,
                    'language': 'GNU C++17',
                    'solution_code': sample_code(contest_id, problem_index),
                    'notes': 'Шешілді: идеясы түсіндіріліп, негізгі edge-case тексерілді.',
                },
            )

    def ensure_pomodoro(self, user):
        rank = TOP_STUDENT_RANKS[user.username]
        target_focus = 825 - (rank * 25)
        sessions_count = target_focus // 25
        now = timezone.now()

        PomodoroSession.objects.filter(user=user).delete()
        focus_minutes = 0
        for session_index in range(sessions_count):
            day = session_index % DEMO_DAYS_ELAPSED
            session_number = session_index // DEMO_DAYS_ELAPSED
            started_at = now - timedelta(
                days=day,
                hours=17 + session_number,
                minutes=(rank * 5) % 45,
            )
            PomodoroSession.objects.create(
                user=user,
                mode=PomodoroSession.Mode.FOCUS,
                duration_minutes=25,
                completed=True,
                started_at=started_at,
                ended_at=started_at + timedelta(minutes=25),
            )
            focus_minutes += 25

        User.objects.filter(id=user.id).update(focus_points=focus_minutes)
        user.focus_points = focus_minutes

    def ensure_standups(self, user):
        DailyStandup.objects.filter(user=user).delete()
        for day in range(DEMO_DAYS_ELAPSED):
            report = DailyStandup.objects.create(
                user=user,
                what_done=(
                    'Codeforces есептерін шешіп, алгоритм идеясын жаздым.'
                    if user.faction == Faction.INFORMATICS
                    else 'Робот қозғалысын тексеріп, датчик мәндерін калибрледім.'
                ),
                difficulties=(
                    'Күрделі edge-case талдадым.'
                    if user.faction == Faction.INFORMATICS
                    else 'Бұрылыста тұрақтылықты жақсарту керек болды.'
                ),
                plan_next=(
                    'Келесі күні күрделірек есеп шығару.'
                    if user.faction == Faction.INFORMATICS
                    else 'PID параметрін нақтылап, тест нәтижесін сақтау.'
                ),
            )
            report.date = timezone.localdate() - timedelta(days=day)
            report.save(update_fields=['date'])
