from datetime import timedelta

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F
from .permissions import IsPlatformAdminOrReadOnly, is_platform_admin
from .models import PomodoroSession, User, UserRole
from .serializers import PomodoroSessionSerializer, UserSerializer
from codeforces.models import CodeforcesSolution
from codeforces.serializers import CodeforcesSolutionSerializer
from events.models import RSVP, EventCategory
from tasks.models import DailyStandup, Task, TaskStatus
from tasks.serializers import DailyStandupSerializer, TaskSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsPlatformAdminOrReadOnly]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        target_user = self.get_object()
        requester = request.user

        if not is_platform_admin(requester) and requester.role == UserRole.STUDENT and requester.id != target_user.id:
            return Response(
                {'detail': 'Оқушы тек өз профилін көре алады.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        tasks = Task.objects.select_related('assigned_to').filter(assigned_to=target_user)
        codeforces_solutions = CodeforcesSolution.objects.select_related('user').filter(user=target_user)
        pomodoro_sessions = PomodoroSession.objects.select_related('user').filter(user=target_user)
        focus_sessions = pomodoro_sessions.filter(mode=PomodoroSession.Mode.FOCUS, completed=True)
        standups = DailyStandup.objects.select_related('user').filter(user=target_user)
        rsvps = RSVP.objects.select_related('event', 'user').filter(user=target_user)

        now = timezone.now()
        stuck_threshold = now - timedelta(days=3)
        stuck_tasks = tasks.filter(
            status=TaskStatus.IN_PROGRESS,
            started_at__lte=stuck_threshold,
        ).count()
        overdue_tasks = tasks.exclude(status=TaskStatus.DONE).filter(deadline__lt=now).count()
        codeforces_solved = codeforces_solutions.filter(status=CodeforcesSolution.Status.SOLVED).count()
        focus_minutes = sum(session.duration_minutes for session in focus_sessions)
        active_days = set(focus_sessions.values_list('ended_at__date', flat=True))
        streak_days = self.calculate_streak(active_days)
        olympiad_rsvps = rsvps.filter(
            is_attending=True,
            event__category=EventCategory.OLYMPIAD,
        )
        attended_events = rsvps.filter(is_attending=True)

        stats = {
            'tasks_total': tasks.count(),
            'tasks_done': tasks.filter(status=TaskStatus.DONE).count(),
            'tasks_in_progress': tasks.filter(status=TaskStatus.IN_PROGRESS).count(),
            'tasks_review': tasks.filter(status=TaskStatus.REVIEW).count(),
            'stuck_tasks': stuck_tasks,
            'overdue_tasks': overdue_tasks,
            'codeforces_total': codeforces_solutions.count(),
            'codeforces_solved': codeforces_solved,
            'codeforces_solving': codeforces_solutions.filter(status=CodeforcesSolution.Status.SOLVING).count(),
            'focus_minutes': focus_minutes,
            'focus_sessions': focus_sessions.count(),
            'active_days': len(active_days),
            'streak_days': streak_days,
            'standups_count': standups.count(),
            'olympiads_count': olympiad_rsvps.count(),
            'events_attending_count': attended_events.count(),
        }

        return Response({
            'user': UserSerializer(target_user).data,
            'stats': stats,
            'analysis': self.build_profile_analysis(stats),
            'achievements': self.build_profile_achievements(stats),
            'tasks': TaskSerializer(tasks.order_by('-updated_at'), many=True).data,
            'codeforces_solutions': CodeforcesSolutionSerializer(
                codeforces_solutions.order_by('-updated_at'),
                many=True,
                context={'request': request},
            ).data,
            'pomodoro_sessions': PomodoroSessionSerializer(
                pomodoro_sessions.order_by('-ended_at')[:20],
                many=True,
            ).data,
            'standups': DailyStandupSerializer(
                standups.order_by('-date')[:20],
                many=True,
            ).data,
            'rsvps': [self.serialize_profile_rsvp(rsvp) for rsvp in rsvps.order_by('-event__start_time')],
        })

    def calculate_streak(self, active_days):
        today = timezone.localdate()
        streak = 0
        current_day = today
        while current_day in active_days:
            streak += 1
            current_day -= timedelta(days=1)
        return streak

    def build_profile_analysis(self, stats):
        analysis = []
        if stats['stuck_tasks'] or stats['overdue_tasks']:
            analysis.append({
                'level': 'warning',
                'title': 'Тапсырмалар бойынша тәуекел бар',
                'text': f"{stats['stuck_tasks']} тапсырма 3 күннен ұзақ тұр, мерзімі өткен: {stats['overdue_tasks']}.",
            })
        elif stats['tasks_total']:
            analysis.append({
                'level': 'good',
                'title': 'Kanban қалыпты',
                'text': 'Тоқтап қалған немесе мерзімі өткен тапсырма жоқ.',
            })

        if stats['codeforces_solved'] >= 5:
            analysis.append({
                'level': 'good',
                'title': 'Codeforces практикасы мықты',
                'text': f"{stats['codeforces_solved']} есеп шешілді, күрделірек есеп беруге болады.",
            })
        elif stats['codeforces_total']:
            analysis.append({
                'level': 'info',
                'title': 'Codeforces басталды',
                'text': f"Жұмыста {stats['codeforces_total']} есеп, шешілгені {stats['codeforces_solved']}.",
            })
        else:
            analysis.append({
                'level': 'warning',
                'title': 'Codeforces шешімдері жоқ',
                'text': '800-1000 рейтингіндегі жеңіл есептерді беріп, алғашқы шешімді тексеру керек.',
            })

        if stats['focus_minutes'] >= 250:
            analysis.append({
                'level': 'good',
                'title': 'Фокус тәртібі жақсы',
                'text': f"{stats['focus_minutes']} минут фокус-сессия жиналды.",
            })
        else:
            analysis.append({
                'level': 'info',
                'title': 'Фокусты күшейтуге болады',
                'text': 'Апталық мақсат: кемінде 5 Pomodoro-сессия.',
            })

        return analysis

    def build_profile_achievements(self, stats):
        return [
            {
                'title': 'Алғашқы шешім',
                'description': 'Алғашқы шешілген Codeforces есебін сақтау.',
                'unlocked': stats['codeforces_solved'] >= 1,
            },
            {
                'title': 'Codeforces x5',
                'description': '5 Codeforces есебін шешу.',
                'unlocked': stats['codeforces_solved'] >= 5,
            },
            {
                'title': 'Тұрақты фокус',
                'description': '250 минут фокус-сессия жинау.',
                'unlocked': stats['focus_minutes'] >= 250,
            },
            {
                'title': 'Олимпиада қатысушысы',
                'description': 'Олимпиадаға немесе турнирге қатысушы болып белгілену.',
                'unlocked': stats['olympiads_count'] >= 1,
            },
            {
                'title': 'Командалық есеп',
                'description': '5 күнделікті есеп толтыру.',
                'unlocked': stats['standups_count'] >= 5,
            },
        ]

    def serialize_profile_rsvp(self, rsvp):
        event = rsvp.event
        return {
            'id': rsvp.id,
            'is_attending': rsvp.is_attending,
            'created_at': rsvp.created_at,
            'event': {
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'category': event.category,
                'start_time': event.start_time,
                'end_time': event.end_time,
                'is_pinned': event.is_pinned,
            },
        }

    def get_queryset(self):
        user = self.request.user
        if is_platform_admin(user):
            return User.objects.all()
        # Non-staff can only see users in their faction
        return User.objects.filter(faction=user.faction)


class PomodoroSessionViewSet(viewsets.ModelViewSet):
    serializer_class = PomodoroSessionSerializer
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if is_platform_admin(user):
            return PomodoroSession.objects.select_related('user').all()
        if user.role == UserRole.LEADER:
            return PomodoroSession.objects.select_related('user').filter(user__faction=user.faction)
        return PomodoroSession.objects.select_related('user').filter(user=user)

    def perform_create(self, serializer):
        duplicate = PomodoroSession.objects.filter(
            user=self.request.user,
            mode=serializer.validated_data.get('mode'),
            duration_minutes=serializer.validated_data.get('duration_minutes'),
            started_at=serializer.validated_data.get('started_at'),
            completed=serializer.validated_data.get('completed', True),
        ).first()
        if duplicate:
            serializer.instance = duplicate
            return

        session = serializer.save(user=self.request.user)
        if session.completed and session.mode == PomodoroSession.Mode.FOCUS:
            User.objects.filter(id=self.request.user.id).update(
                focus_points=F('focus_points') + session.duration_minutes
            )
