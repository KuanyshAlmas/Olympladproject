from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import DailyStandup, ProgramItem, ProgramResource, ProgramTrack, Task, TaskStatus
from .serializers import (
    DailyStandupSerializer,
    ProgramItemSerializer,
    ProgramResourceSerializer,
    ProgramTrackSerializer,
    TaskSerializer,
)
from .roadmap import ROADMAP_LEVELS, find_roadmap_topic, roadmap_topics_with_resources
from core.models import Faction, UserRole
from core.permissions import IsPlatformAdminOrReadOnly, is_platform_admin

class IsOwnerOrLeader(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in [UserRole.SUPERUSER, UserRole.LEADER]:
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'assigned_to'):
            return obj.assigned_to == request.user
        return False

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.SUPERUSER:
            return Task.objects.all()
        if user.role == UserRole.STUDENT:
            return Task.objects.filter(faction=user.faction, assigned_to=user)
        return Task.objects.filter(faction=user.faction)

    def check_permissions(self, request):
        super().check_permissions(request)

        if request.method in permissions.SAFE_METHODS:
            return

        if request.method == 'POST' and request.user.role not in [UserRole.SUPERUSER, UserRole.LEADER]:
            self.permission_denied(request, message='Тапсырманы тек әкімші немесе топ жетекшісі қоса алады.')

    def perform_create(self, serializer):
        assigned_to = serializer.validated_data.get('assigned_to')

        if not is_platform_admin(self.request.user):
            if assigned_to and assigned_to.faction != self.request.user.faction:
                self.permission_denied(self.request, message='Топ жетекшісі тапсырманы тек өз бағытының ішінде бере алады.')
            serializer.save(faction=self.request.user.faction)
        else:
            serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        task = self.get_object()

        if is_platform_admin(user):
            serializer.save()
            return

        if user.role == UserRole.LEADER and task.faction == user.faction:
            serializer.save(faction=user.faction)
            return

        if task.assigned_to_id == user.id:
            serializer.save(faction=task.faction, assigned_to=task.assigned_to)
            return

        self.permission_denied(self.request, message='Тек өзіңізге берілген тапсырманы өзгерте аласыз.')

    def perform_destroy(self, instance):
        user = self.request.user
        if is_platform_admin(user) or (user.role == UserRole.LEADER and instance.faction == user.faction):
            instance.delete()
            return

        self.permission_denied(self.request, message='Тапсырманы тек әкімші немесе топ жетекшісі өшіре алады.')

class DailyStandupViewSet(viewsets.ModelViewSet):
    serializer_class = DailyStandupSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrLeader]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.SUPERUSER:
            return DailyStandup.objects.all()
        if user.role == UserRole.LEADER:
            return DailyStandup.objects.filter(user__faction=user.faction)
        return DailyStandup.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProgramTrackViewSet(viewsets.ModelViewSet):
    serializer_class = ProgramTrackSerializer
    permission_classes = [IsPlatformAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = ProgramTrack.objects.all()
        if self.request.method in permissions.SAFE_METHODS:
            if not is_platform_admin(user):
                queryset = queryset.filter(is_active=True, faction__in=[Faction.NONE, user.faction])
        return queryset.order_by('order', 'title')


class ProgramItemViewSet(viewsets.ModelViewSet):
    serializer_class = ProgramItemSerializer
    permission_classes = [IsPlatformAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = ProgramItem.objects.select_related('track')
        if self.request.method in permissions.SAFE_METHODS:
            if not is_platform_admin(user):
                queryset = queryset.filter(
                    is_active=True,
                    track__is_active=True,
                    track__faction__in=[Faction.NONE, user.faction],
                )
        return queryset.order_by('track__order', 'order', 'title')


class ProgramResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ProgramResourceSerializer
    permission_classes = [IsPlatformAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = ProgramResource.objects.select_related('item', 'item__track')
        if self.request.method in permissions.SAFE_METHODS:
            if not is_platform_admin(user):
                queryset = queryset.filter(
                    is_active=True,
                    item__is_active=True,
                    item__track__is_active=True,
                    item__track__faction__in=[Faction.NONE, user.faction],
                )
        return queryset.order_by('item__track__order', 'item__order', 'order', 'title')


class RoadmapTopicListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'levels': ROADMAP_LEVELS,
            'topics': roadmap_topics_with_resources(),
        })


class ProgramTrackListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tracks = self.visible_tracks(request.user)
        items = ProgramItem.objects.select_related('track').prefetch_related('resources').filter(track__in=tracks)
        if not is_platform_admin(request.user):
            items = items.filter(is_active=True, track__is_active=True)
        items = items.order_by('track__order', 'order', 'title')

        return Response({
            'tracks': ProgramTrackSerializer(tracks, many=True, context={'request': request}).data,
            'items': ProgramItemSerializer(items, many=True, context={'request': request}).data,
        })

    def visible_tracks(self, user):
        queryset = ProgramTrack.objects.all()
        if is_platform_admin(user):
            return queryset.order_by('order', 'title')

        return queryset.filter(is_active=True, faction__in=[Faction.NONE, user.faction]).order_by('order', 'title')


class ProgramItemToKanbanView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, item_id):
        item = ProgramItem.objects.select_related('track').filter(id=item_id, is_active=True).first()
        if not item:
            return Response({'detail': 'Бағдарлама элементі табылмады.'}, status=404)

        track = item.track

        user = request.user
        if not self.can_use_track(user, track):
            return Response({'detail': 'Бұл бағдарлама бағыты сізге қолжетімсіз.'}, status=403)

        faction = self.task_faction(user, track)
        title = f"{self.kind_label(item.kind)}: {item.title}"
        existing = Task.objects.filter(
            assigned_to=user,
            description__contains=f"[Program:{item.id}]",
        ).first()
        if existing:
            return Response({
                'created': False,
                'task': TaskSerializer(existing).data,
            })

        task = Task.objects.create(
            title=title,
            description=self.build_task_description(track, item),
            faction=faction,
            status=TaskStatus.TODO,
            assigned_to=user,
        )
        return Response({
            'created': True,
            'task': TaskSerializer(task).data,
        }, status=201)

    def can_use_track(self, user, track):
        return is_platform_admin(user) or track.faction in [Faction.NONE, user.faction]

    def task_faction(self, user, track):
        if user.faction != Faction.NONE:
            return user.faction
        if track.faction != Faction.NONE:
            return track.faction
        return Faction.INFORMATICS

    def kind_label(self, kind):
        return {
            'diagnostic': 'Диагностика',
            'lesson': 'Сабақ',
            'quiz': 'Қысқа тест',
            'contest': 'Жарыс',
            'project': 'Жоба',
        }.get(kind, 'Бағдарлама')

    def build_task_description(self, track, item):
        resources = item.resources.filter(is_active=True).order_by('order', 'title')
        resource_lines = '\n'.join(
            f"- {resource.title} ({resource.source or resource.kind}): {resource.url}"
            for resource in resources
        )
        return (
            f"[Program:{item.id}]\n"
            f"Бағыт: {track.title}\n"
            f"Түрі: {self.kind_label(item.kind)}\n"
            f"Ұзақтығы: {item.duration_minutes} минут\n\n"
            f"{item.description}\n\n"
            f"Тақырыптар: {', '.join(item.topics)}\n"
            f"Тәжірибе: {', '.join(item.practice)}"
            + (f"\n\nСілтемелер:\n{resource_lines}" if resource_lines else '')
        )


class RoadmapToKanbanView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, topic_id):
        topic = find_roadmap_topic(topic_id)
        if not topic:
            return Response({'detail': 'Жол картасының тақырыбы табылмады.'}, status=404)

        user = request.user
        faction = user.faction if user.faction != Faction.NONE else Faction.INFORMATICS
        title = f"Жол картасы: {topic['title']}"
        description = self.build_task_description(topic)

        existing = Task.objects.filter(
            assigned_to=user,
            description__contains=f"[Roadmap:{topic['id']}]",
        ).first()
        if existing:
            return Response({
                'created': False,
                'task': TaskSerializer(existing).data,
            })

        task = Task.objects.create(
            title=title,
            description=description,
            faction=faction,
            status=TaskStatus.TODO,
            assigned_to=user,
        )
        return Response({
            'created': True,
            'task': TaskSerializer(task).data,
        }, status=201)

    def build_task_description(self, topic):
        resource_lines = '\n'.join(
            f"- {resource['title']} ({resource.get('source') or resource['kind']}): {resource['url']}"
            for resource in topic.get('resources', [])
        )
        return (
            f"[Roadmap:{topic['id']}]\n"
            f"Деңгей: {topic['level']}\n"
            f"Күрделілік: {topic['difficulty']}\n"
            f"Уақыт бағасы: {topic['estimated_hours']} сағ.\n\n"
            f"{topic['description']}\n\n"
            f"Нені оқу керек: {', '.join(topic['topics'])}\n"
            f"Тәжірибе: {', '.join(topic['practice'])}"
            + (f"\n\nСілтемелер:\n{resource_lines}" if resource_lines else '')
        )
