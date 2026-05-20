import os
import django
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from core.models import User, UserRole, Faction
from tasks.models import Task, TaskStatus
from events.models import Event, EventCategory
from gamification.models import Skill, UserSkill

def seed():
    # Create Superuser
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'adminpass', role=UserRole.SUPERUSER)
        print("Superuser created: admin / adminpass")

    # Create Factions
    # (Factions are Choices, so we just use them in User creation)

    # Create Leaders
    if not User.objects.filter(username='leader_info').exists():
        User.objects.create_user('leader_info', 'info@example.com', 'leaderpass', 
                                 role=UserRole.LEADER, faction=Faction.INFORMATICS)
        print("Informatics Leader created")
    
    if not User.objects.filter(username='leader_robo').exists():
        User.objects.create_user('leader_robo', 'robo@example.com', 'leaderpass', 
                                 role=UserRole.LEADER, faction=Faction.ROBOTICS)
        print("Robotics Leader created")

    # Create Students
    if not User.objects.filter(username='student_info').exists():
        User.objects.create_user('student_info', 's1@example.com', 'studentpass', 
                                 role=UserRole.STUDENT, faction=Faction.INFORMATICS)
        print("Informatics Student created")

    if not User.objects.filter(username='student_robo').exists():
        User.objects.create_user('student_robo', 's2@example.com', 'studentpass', 
                                 role=UserRole.STUDENT, faction=Faction.ROBOTICS)
        print("Robotics Student created")

    users = {
        user.username: user
        for user in User.objects.filter(username__in=[
            'student_info',
            'student_robo',
            'leader_info',
            'leader_robo',
        ])
    }

    demo_scores = {
        'leader_info': {'focus_points': 620, 'social_gpa': 4.8},
        'student_info': {'focus_points': 410, 'social_gpa': 4.4},
        'leader_robo': {'focus_points': 540, 'social_gpa': 4.7},
        'student_robo': {'focus_points': 360, 'social_gpa': 4.2},
    }
    for username, values in demo_scores.items():
        user = users.get(username)
        if user:
            User.objects.filter(id=user.id).update(**values)
            user.refresh_from_db()
    print("Demo user scores updated")

    def ensure_task(title, faction, description, status, assigned_to=None, deadline_days=None, started_days=1):
        task, created = Task.objects.get_or_create(
            title=title,
            faction=faction,
            defaults={
                'description': description,
                'status': status,
                'assigned_to': assigned_to,
                'deadline': timezone.now() + timedelta(days=deadline_days) if deadline_days else None,
                'started_at': timezone.now() - timedelta(days=started_days) if status == TaskStatus.IN_PROGRESS else None,
            }
        )
        changed = False
        if not task.description:
            task.description = description
            changed = True
        if not task.assigned_to and assigned_to:
            task.assigned_to = assigned_to
            changed = True
        if not task.deadline and deadline_days:
            task.deadline = timezone.now() + timedelta(days=deadline_days)
            changed = True
        if task.status != status:
            task.status = status
            changed = True
        if status == TaskStatus.IN_PROGRESS:
            task.started_at = timezone.now() - timedelta(days=1)
            changed = True
        if status == TaskStatus.IN_PROGRESS and started_days:
            task.started_at = timezone.now() - timedelta(days=started_days)
            changed = True
        if changed:
            task.save()
        return created

    ensure_task(
        "Binary Search",
        Faction.INFORMATICS,
        "Solve five problems and explain lower_bound / upper_bound.",
        TaskStatus.IN_PROGRESS,
        users.get('student_info'),
        3,
        started_days=4,
    )
    ensure_task(
        "Graph BFS Practice",
        Faction.INFORMATICS,
        "Finish shortest-path warmup tasks and submit notes.",
        TaskStatus.TODO,
        users.get('student_info'),
        5,
    )
    ensure_task(
        "Dynamic Programming Basics",
        Faction.INFORMATICS,
        "Prepare examples for knapsack and longest subsequence.",
        TaskStatus.REVIEW,
        users.get('leader_info'),
        7,
    )
    ensure_task(
        "PID Controller",
        Faction.ROBOTICS,
        "Tune proportional and derivative coefficients on the test track.",
        TaskStatus.IN_PROGRESS,
        users.get('student_robo'),
        4,
        started_days=5,
    )
    ensure_task(
        "Line Sensor Calibration",
        Faction.ROBOTICS,
        "Record sensor values on white, black and mixed surfaces.",
        TaskStatus.TODO,
        users.get('student_robo'),
        2,
    )
    ensure_task(
        "Chassis Stability Check",
        Faction.ROBOTICS,
        "Inspect wheel alignment and tighten the motor mounts.",
        TaskStatus.DONE,
        users.get('leader_robo'),
        1,
    )
    print("Demo tasks created")

    def ensure_skill(name, faction, description, user=None, level=UserSkill.Level.NOT_STARTED):
        skill, _ = Skill.objects.get_or_create(
            name=name,
            faction=faction,
            defaults={'description': description}
        )
        if not skill.description:
            skill.description = description
            skill.save()
        if user:
            UserSkill.objects.update_or_create(
                user=user,
                skill=skill,
                defaults={'level': level}
            )

    ensure_skill("Algorithms: Binary Search", Faction.INFORMATICS, "Search on answer and sorted arrays.", users.get('student_info'), UserSkill.Level.IN_PROGRESS)
    ensure_skill("Algorithms: Graphs", Faction.INFORMATICS, "BFS, DFS and shortest paths.", users.get('student_info'), UserSkill.Level.NOT_STARTED)
    ensure_skill("Algorithms: Dynamic Programming", Faction.INFORMATICS, "Optimization and state transitions.", users.get('leader_info'), UserSkill.Level.COMPLETED)
    ensure_skill("Robotics: Sensors", Faction.ROBOTICS, "Reading and calibrating line sensors.", users.get('student_robo'), UserSkill.Level.IN_PROGRESS)
    ensure_skill("Robotics: Control", Faction.ROBOTICS, "PID basics and movement stabilization.", users.get('student_robo'), UserSkill.Level.NOT_STARTED)
    ensure_skill("Robotics: 3D Printing", Faction.ROBOTICS, "Preparing durable parts for prototypes.", users.get('leader_robo'), UserSkill.Level.COMPLETED)
    print("Demo skills created")

    now = timezone.now()
    demo_events = [
        {
            'title': 'Regional Olympiad Registration',
            'description': 'Deadline for submitting final participant list and required documents.',
            'category': EventCategory.OLYMPIAD,
            'start_time': now + timedelta(days=10, hours=9),
            'end_time': now + timedelta(days=10, hours=11),
            'is_pinned': True,
        },
        {
            'title': 'Internal Algorithm Sprint',
            'description': 'Two-hour training contest with review of the hardest tasks.',
            'category': EventCategory.INTERNAL,
            'start_time': now + timedelta(days=3, hours=15),
            'end_time': now + timedelta(days=3, hours=17),
            'is_pinned': False,
        },
        {
            'title': 'Robotics Track Test',
            'description': 'Practice run for line-following robots and sensor calibration.',
            'category': EventCategory.INTERNAL,
            'start_time': now + timedelta(days=5, hours=14),
            'end_time': now + timedelta(days=5, hours=16),
            'is_pinned': False,
        },
        {
            'title': 'School Science Day',
            'description': 'Public demo of student projects for parents and school guests.',
            'category': EventCategory.SCHOOL,
            'start_time': now + timedelta(days=18, hours=10),
            'end_time': now + timedelta(days=18, hours=13),
            'is_pinned': False,
        },
    ]

    for event in demo_events:
        Event.objects.update_or_create(
            title=event['title'],
            defaults=event,
        )
    print("Demo events created")

if __name__ == '__main__':
    seed()
