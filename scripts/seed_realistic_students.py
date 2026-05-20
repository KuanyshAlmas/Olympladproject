#!/usr/bin/env python3
import os
import random
import sys
from datetime import timedelta

import django


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db.models import Q
from django.utils import timezone

from codeforces.models import CodeforcesSolution
from core.models import Faction, PomodoroSession, User, UserRole
from events.models import Event, EventCategory, RSVP
from gamification.models import Skill, UserSkill
from tasks.models import DailyStandup, Task, TaskStatus
from tasks.roadmap import ROADMAP_TOPICS


PASSWORD = 'studentpass'


STUDENTS = [
    ('alibek.saken', 'Алибек', 'Сакен', Faction.INFORMATICS, 4.7),
    ('aruzhan.serik', 'Аружан', 'Серик', Faction.INFORMATICS, 4.5),
    ('dias.kairat', 'Диас', 'Кайрат', Faction.INFORMATICS, 4.2),
    ('madina.ermek', 'Мадина', 'Ермек', Faction.INFORMATICS, 4.8),
    ('nursultan.aset', 'Нурсултан', 'Асет', Faction.INFORMATICS, 3.9),
    ('dana.marat', 'Дана', 'Марат', Faction.INFORMATICS, 4.6),
    ('sanzhar.bek', 'Санжар', 'Бек', Faction.INFORMATICS, 4.1),
    ('tomiris.sagat', 'Томирис', 'Сагат', Faction.INFORMATICS, 4.9),
    ('erasil.talgat', 'Ерасыл', 'Талгат', Faction.INFORMATICS, 3.8),
    ('yernar.ali', 'Ернар', 'Али', Faction.INFORMATICS, 4.0),
    ('ayaulym.bolat', 'Аяулым', 'Болат', Faction.INFORMATICS, 4.4),
    ('alikhan.oraz', 'Алихан', 'Ораз', Faction.INFORMATICS, 4.3),
    ('alina.rustem', 'Алина', 'Рустем', Faction.ROBOTICS, 4.6),
    ('beibarys.nur', 'Бейбарыс', 'Нур', Faction.ROBOTICS, 4.1),
    ('meruert.kai', 'Меруерт', 'Кай', Faction.ROBOTICS, 4.8),
    ('adil.samat', 'Адиль', 'Самат', Faction.ROBOTICS, 3.9),
    ('zere.murat', 'Зере', 'Мурат', Faction.ROBOTICS, 4.5),
    ('rayan.askar', 'Раян', 'Аскар', Faction.ROBOTICS, 4.0),
    ('kamila.arman', 'Камила', 'Арман', Faction.ROBOTICS, 4.7),
    ('emir.tore', 'Эмир', 'Торе', Faction.ROBOTICS, 3.8),
    ('aisha.daniyar', 'Аиша', 'Данияр', Faction.ROBOTICS, 4.2),
    ('imanbek.sabit', 'Иманбек', 'Сабит', Faction.ROBOTICS, 4.3),
]


EVENTS = [
    (
        'Городская олимпиада по информатике',
        'Отборочный тур для школьной команды. Участники решают 4 алгоритмические задачи.',
        EventCategory.OLYMPIAD,
        12,
        4,
        True,
    ),
    (
        'Областная олимпиада по программированию',
        'Финальный состав команды готовит решения по графам, DP и математике.',
        EventCategory.OLYMPIAD,
        31,
        5,
        True,
    ),
    (
        'Внутренний Codeforces Sprint #4',
        'Тренировочный контест на 90 минут с разбором после завершения.',
        EventCategory.INTERNAL,
        5,
        2,
        False,
    ),
    (
        'Robotics Line Follower Cup',
        'Практический заезд роботов по линии: датчики, PID, стабильность шасси.',
        EventCategory.OLYMPIAD,
        18,
        4,
        True,
    ),
    (
        'Arduino Sensors Workshop',
        'Практикум по ультразвуковым датчикам, сервоприводам и калибровке сенсоров.',
        EventCategory.INTERNAL,
        9,
        3,
        False,
    ),
    (
        'Школьный хакатон проектов',
        'Командная защита учебных проектов для родителей и администрации школы.',
        EventCategory.SCHOOL,
        25,
        5,
        False,
    ),
]


CF_PROBLEMS = [
    (4, 'A', 'Watermelon', 800, ['math', 'brute force']),
    (71, 'A', 'Way Too Long Words', 800, ['strings']),
    (158, 'A', 'Next Round', 800, ['implementation']),
    (231, 'A', 'Team', 800, ['greedy']),
    (282, 'A', 'Bit++', 800, ['implementation']),
    (50, 'A', 'Domino piling', 800, ['math']),
    (263, 'A', 'Beautiful Matrix', 800, ['implementation']),
    (339, 'A', 'Helpful Maths', 800, ['sortings', 'strings']),
    (118, 'A', 'String Task', 1000, ['strings']),
    (266, 'B', 'Queue at the School', 800, ['implementation']),
    (281, 'A', 'Word Capitalization', 800, ['strings']),
    (236, 'A', 'Boy or Girl', 800, ['strings']),
]


INFO_TASKS = [
    ('Binary Search practice', 'lower_bound, upper_bound және answer search бойынша 5 есеп.'),
    ('Prefix sums warmup', 'Бір өлшемді және екі өлшемді prefix sum қолдану.'),
    ('Graph BFS/DFS', 'Компоненттер, grid graph және қысқа жол есептері.'),
    ('Dynamic Programming basics', '1D DP, knapsack және LIS есептерін талдау.'),
    ('Greedy proof notes', 'Жадный шешімнің дәлелін жазып үйрену.'),
    ('Codeforces 900 set', '800-1000 рейтинг аралығындағы 6 есеп шешу.'),
]


ROBO_TASKS = [
    ('Arduino sensor calibration', 'Ақ/қара бетте датчик мәндерін өлшеп, кесте жасау.'),
    ('Line follower PID tuning', 'P, I, D коэффициенттерін тест трассада реттеу.'),
    ('Chassis stability check', 'Дөңгелек, мотор бекітпесі және центр массасын тексеру.'),
    ('Ultrasonic obstacle mode', 'Кедергіні анықтау және тоқтау алгоритмін жазу.'),
    ('Servo gripper prototype', 'Сервоприводпен қарапайым ұстап алу механизмін құру.'),
    ('Bluetooth control test', 'Телефоннан басқару командаларын қабылдау.'),
]


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
    if (contest_id, index) == (71, 'A'):
        return (
            '#include <bits/stdc++.h>\n'
            'using namespace std;\n\n'
            'int main() {\n'
            '    int n;\n'
            '    cin >> n;\n'
            '    while (n--) {\n'
            '        string s;\n'
            '        cin >> s;\n'
            '        if (s.size() > 10) cout << s[0] << s.size() - 2 << s.back();\n'
            '        else cout << s;\n'
            '        cout << "\\n";\n'
            '    }\n'
            '}\n'
        )
    return (
        '#include <bits/stdc++.h>\n'
        'using namespace std;\n\n'
        'int main() {\n'
        '    ios::sync_with_stdio(false);\n'
        '    cin.tie(nullptr);\n'
        '    // Решение сохранено учеником для проверки идеи.\n'
        '    return 0;\n'
        '}\n'
    )


def reset_old_students():
    old_student_ids = list(
        User.objects.filter(Q(role=UserRole.STUDENT) | Q(username__startswith='qa_'))
        .values_list('id', flat=True)
    )
    Task.objects.filter(Q(assigned_to_id__in=old_student_ids) | Q(title__startswith='QA ')).delete()
    User.objects.filter(id__in=old_student_ids).delete()

    old_event_titles = [
        'Regional Olympiad Registration',
        'Internal Algorithm Sprint',
        'Robotics Track Test',
        'School Science Day',
        'QA Олимпиада по алгоритмам',
        'QA Внутренний контест',
        'QA Школьный хакатон',
    ]
    Event.objects.filter(Q(title__in=old_event_titles) | Q(title__startswith='QA ')).delete()


def ensure_core_accounts():
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@olymplad.kz',
            'role': UserRole.SUPERUSER,
            'faction': Faction.NONE,
            'is_staff': True,
            'is_superuser': True,
        },
    )
    admin.email = 'admin@olymplad.kz'
    admin.role = UserRole.SUPERUSER
    admin.faction = Faction.NONE
    admin.is_staff = True
    admin.is_superuser = True
    admin.set_password('adminpass')
    admin.save()

    leaders = [
        ('leader_info', 'Айдос', 'Мұратұлы', 'mentor.info@olymplad.kz', Faction.INFORMATICS),
        ('leader_robo', 'Динара', 'Серікқызы', 'mentor.robo@olymplad.kz', Faction.ROBOTICS),
    ]
    for username, first_name, last_name, email, faction in leaders:
        leader, _ = User.objects.get_or_create(
            username=username,
            defaults={'role': UserRole.LEADER, 'faction': faction},
        )
        leader.first_name = first_name
        leader.last_name = last_name
        leader.email = email
        leader.role = UserRole.LEADER
        leader.faction = faction
        leader.social_gpa = 4.9
        leader.focus_points = 720 if faction == Faction.INFORMATICS else 680
        leader.set_password('leaderpass')
        leader.save()


def create_events():
    now = timezone.now()
    events = []
    for title, description, category, starts_in_days, duration_hours, pinned in EVENTS:
        event, _ = Event.objects.update_or_create(
            title=title,
            defaults={
                'description': description,
                'category': category,
                'start_time': now + timedelta(days=starts_in_days),
                'end_time': now + timedelta(days=starts_in_days, hours=duration_hours),
                'is_pinned': pinned,
            },
        )
        events.append(event)
    return events


def create_students():
    students = []
    for username, first_name, last_name, faction, gpa in STUDENTS:
        user = User.objects.create_user(
            username=username,
            email=f'{username}@olymplad.kz',
            password=PASSWORD,
            role=UserRole.STUDENT,
            faction=faction,
            first_name=first_name,
            last_name=last_name,
            social_gpa=gpa,
        )
        students.append(user)
    return students


def create_skills_for_student(user, rng, index):
    for skill_name, description in SKILLS[user.faction]:
        skill, _ = Skill.objects.get_or_create(
            name=skill_name,
            faction=user.faction,
            defaults={'description': description},
        )
        level = [UserSkill.Level.NOT_STARTED, UserSkill.Level.IN_PROGRESS, UserSkill.Level.COMPLETED][
            (index + rng.randint(0, 2)) % 3
        ]
        UserSkill.objects.update_or_create(
            user=user,
            skill=skill,
            defaults={'level': level},
        )


def create_tasks_for_student(user, rng, index):
    source = INFO_TASKS if user.faction == Faction.INFORMATICS else ROBO_TASKS
    statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE]
    now = timezone.now()

    for offset in range(4):
        title, description = source[(index + offset) % len(source)]
        status_value = statuses[(index + offset) % len(statuses)]
        started_at = None
        if status_value == TaskStatus.IN_PROGRESS:
            started_at = now - timedelta(days=1 + (index % 5))
        Task.objects.create(
            title=f'{title} — {user.first_name}',
            description=description,
            faction=user.faction,
            status=status_value,
            assigned_to=user,
            deadline=now + timedelta(days=3 + offset + (index % 4)),
            started_at=started_at,
        )

    if user.faction == Faction.INFORMATICS:
        topic = ROADMAP_TOPICS[index % len(ROADMAP_TOPICS)]
        Task.objects.create(
            title=f'Roadmap: {topic["title"]}',
            description=(
                f'[Roadmap:{topic["id"]}]\n'
                f'{topic["description"]}\n'
                f'Что изучить: {", ".join(topic["topics"])}'
            ),
            faction=user.faction,
            status=TaskStatus.TODO,
            assigned_to=user,
            deadline=now + timedelta(days=10 + index % 5),
        )


def create_codeforces_for_student(user, rng, index):
    count = 6 if user.faction == Faction.INFORMATICS else 3
    for offset in range(count):
        contest_id, problem_index, name, rating, tags = CF_PROBLEMS[(index + offset) % len(CF_PROBLEMS)]
        if offset < count - 2:
            status_value = CodeforcesSolution.Status.SOLVED
        elif offset == count - 2:
            status_value = CodeforcesSolution.Status.SOLVING
        else:
            status_value = CodeforcesSolution.Status.TODO

        CodeforcesSolution.objects.update_or_create(
            user=user,
            contest_id=contest_id,
            index=problem_index,
            defaults={
                'name': name,
                'rating': rating,
                'tags': tags,
                'status': status_value,
                'language': 'GNU C++17' if index % 3 != 0 else 'Python 3',
                'solution_code': sample_code(contest_id, problem_index) if status_value != CodeforcesSolution.Status.TODO else '',
                'notes': (
                    'Идея: разобрал условие, выписал ограничения, проверил крайние случаи.'
                    if status_value != CodeforcesSolution.Status.TODO
                    else 'Планирую решить после повторения темы.'
                ),
            },
        )


def create_pomodoro_for_student(user, rng, index):
    now = timezone.now()
    focus_minutes = 0
    active_days = 7 + index % 9
    for day in range(active_days):
        sessions_today = 1 + ((index + day) % 3 == 0)
        for session_number in range(sessions_today):
            started_at = now - timedelta(
                days=day,
                hours=17 + session_number,
                minutes=(index * 7) % 45,
            )
            duration = 25 if session_number == 0 else 30
            PomodoroSession.objects.create(
                user=user,
                mode=PomodoroSession.Mode.FOCUS,
                duration_minutes=duration,
                completed=True,
                started_at=started_at,
                ended_at=started_at + timedelta(minutes=duration),
            )
            focus_minutes += duration
    User.objects.filter(id=user.id).update(focus_points=focus_minutes)
    user.focus_points = focus_minutes


def create_standups_for_student(user, rng, index):
    for day in range(6):
        report = DailyStandup.objects.create(
            user=user,
            what_done=(
                'Шешім идеясын жаздым, бір есепті толық өткіздім.'
                if user.faction == Faction.INFORMATICS
                else 'Датчик мәндерін тексеріп, робот қозғалысын калибрледім.'
            ),
            difficulties=(
                'Шектеулерді дұрыс бағалау қиын болды.'
                if user.faction == Faction.INFORMATICS
                else 'Трассада бұрылыс кезінде тұрақтылық төмендеді.'
            ),
            plan_next=(
                'Келесі сабақта тағы 2 Codeforces есеп шығару.'
                if user.faction == Faction.INFORMATICS
                else 'PID параметрлерін қайта өлшеп, тест видеосын сақтау.'
            ),
        )
        report.date = timezone.localdate() - timedelta(days=day)
        report.save(update_fields=['date'])


def create_rsvps_for_student(user, events, index):
    for event in events:
        attending = True
        if user.faction == Faction.INFORMATICS and 'Robotics' in event.title:
            attending = index % 4 == 0
        if user.faction == Faction.ROBOTICS and 'информатике' in event.title:
            attending = index % 5 == 0
        if user.faction == Faction.ROBOTICS and 'Codeforces' in event.title:
            attending = index % 2 == 0
        RSVP.objects.update_or_create(
            user=user,
            event=event,
            defaults={'is_attending': attending},
        )


def seed():
    rng = random.Random(20260519)
    print('Resetting old demo data...', flush=True)
    reset_old_students()
    print('Ensuring core accounts...', flush=True)
    ensure_core_accounts()
    print('Creating events...', flush=True)
    events = create_events()
    print('Creating students...', flush=True)
    students = create_students()

    for index, user in enumerate(students):
        print(f'Seeding {index + 1}/{len(students)}: {user.username}', flush=True)
        create_skills_for_student(user, rng, index)
        create_tasks_for_student(user, rng, index)
        create_codeforces_for_student(user, rng, index)
        create_pomodoro_for_student(user, rng, index)
        create_standups_for_student(user, rng, index)
        create_rsvps_for_student(user, events, index)

    print(f'Created realistic students: {len(students)}')
    print('Password for all students:', PASSWORD)
    print('Informatics:', User.objects.filter(role=UserRole.STUDENT, faction=Faction.INFORMATICS).count())
    print('Robotics:', User.objects.filter(role=UserRole.STUDENT, faction=Faction.ROBOTICS).count())
    print('Kanban tasks:', Task.objects.filter(assigned_to__role=UserRole.STUDENT).count())
    print('Codeforces solutions:', CodeforcesSolution.objects.filter(user__role=UserRole.STUDENT).count())
    print('Pomodoro sessions:', PomodoroSession.objects.filter(user__role=UserRole.STUDENT).count())
    print('Standups:', DailyStandup.objects.filter(user__role=UserRole.STUDENT).count())
    print('RSVP:', RSVP.objects.filter(user__role=UserRole.STUDENT).count())


if __name__ == '__main__':
    seed()
