from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import PomodoroSessionViewSet, UserViewSet
from tasks.views import (
    DailyStandupViewSet,
    ProgramItemToKanbanView,
    ProgramItemViewSet,
    ProgramResourceViewSet,
    ProgramTrackListView,
    ProgramTrackViewSet,
    RoadmapToKanbanView,
    RoadmapTopicListView,
    TaskViewSet,
)
from gamification.views import SkillViewSet, UserSkillViewSet, DuelViewSet
from events.views import EventViewSet, RSVPViewSet
from codeforces.views import (
    CodeforcesProblemListView,
    CodeforcesRunCodeView,
    CodeforcesProblemStatementView,
    CodeforcesSolutionViewSet,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'pomodoro-sessions', PomodoroSessionViewSet, basename='pomodoro-session')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'standups', DailyStandupViewSet, basename='standup')
router.register(r'program-tracks', ProgramTrackViewSet, basename='program-track')
router.register(r'program-items', ProgramItemViewSet, basename='program-item')
router.register(r'program-references', ProgramResourceViewSet, basename='program-reference')
router.register(r'skills', SkillViewSet, basename='skill')
router.register(r'user-skills', UserSkillViewSet, basename='user-skill')
router.register(r'duels', DuelViewSet, basename='duel')
router.register(r'events', EventViewSet, basename='event')
router.register(r'rsvps', RSVPViewSet, basename='rsvp')
router.register(r'codeforces-solutions', CodeforcesSolutionViewSet, basename='codeforces-solution')

urlpatterns = [
    path('', include(router.urls)),
    path('programs/tracks/', ProgramTrackListView.as_view(), name='program_tracks'),
    path(
        'programs/items/<str:item_id>/to-kanban/',
        ProgramItemToKanbanView.as_view(),
        name='program_item_to_kanban',
    ),
    path('roadmap/topics/', RoadmapTopicListView.as_view(), name='roadmap_topics'),
    path(
        'roadmap/topics/<str:topic_id>/to-kanban/',
        RoadmapToKanbanView.as_view(),
        name='roadmap_to_kanban',
    ),
    path('codeforces/problems/', CodeforcesProblemListView.as_view(), name='codeforces_problems'),
    path('codeforces/run/', CodeforcesRunCodeView.as_view(), name='codeforces_run_code'),
    path(
        'codeforces/problems/<int:contest_id>/<str:index>/statement/',
        CodeforcesProblemStatementView.as_view(),
        name='codeforces_problem_statement',
    ),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
