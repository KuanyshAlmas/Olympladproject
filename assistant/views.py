from django.db import transaction
from django.db.models import Count, Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import UserRole
from core.permissions import is_platform_admin
from .gemini import GeminiAssistantError, generate_assistant_reply
from .models import AssistantMessage, AssistantThread
from .serializers import (
    AssistantMessageCreateSerializer,
    AssistantMessageSerializer,
    AssistantThreadSerializer,
)


ASSISTANT_GREETING = (
    'Сәлем! Мен QyranCode ИИ көмекшісімін. '
    'Түсінбей қалған тақырыбыңызды немесе сайтты қалай қолдану керегін сұраңыз.'
)


def visible_threads_for_user(user):
    queryset = AssistantThread.objects.select_related('owner').annotate(messages_count=Count('messages'))
    if is_platform_admin(user):
        return queryset
    if user.role == UserRole.LEADER:
        return queryset.filter(
            Q(owner=user)
            | Q(owner__role=UserRole.STUDENT, owner__faction=user.faction)
        )
    return queryset.filter(owner=user)


def student_threads_for_user(user):
    queryset = AssistantThread.objects.select_related('owner').annotate(messages_count=Count('messages'))
    if is_platform_admin(user):
        return queryset.filter(owner__role=UserRole.STUDENT)
    if user.role == UserRole.LEADER:
        return queryset.filter(owner__role=UserRole.STUDENT, owner__faction=user.faction)
    return queryset.none()


class AssistantThreadViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = AssistantThreadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return visible_threads_for_user(self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        with transaction.atomic():
            title = serializer.validated_data.get('title') or 'QyranCode көмекшісі'
            thread = serializer.save(owner=self.request.user, title=title)
            AssistantMessage.objects.create(
                thread=thread,
                role=AssistantMessage.Role.ASSISTANT,
                content=ASSISTANT_GREETING,
            )

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        thread = self.get_object()

        if request.method == 'GET':
            serializer = AssistantMessageSerializer(thread.messages.all(), many=True)
            return Response(serializer.data)

        if thread.owner_id != request.user.id:
            return Response(
                {'detail': 'Бұл чатқа тек иесі хабарлама жібере алады.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AssistantMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        content = serializer.validated_data['content']

        with transaction.atomic():
            user_message = AssistantMessage.objects.create(
                thread=thread,
                role=AssistantMessage.Role.USER,
                content=content,
            )
            if thread.title == 'QyranCode көмекшісі':
                thread.title = content[:80]
            thread.save(update_fields=['title', 'updated_at'])

        try:
            reply_text = generate_assistant_reply(thread)
        except GeminiAssistantError as exc:
            user_message.delete()
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        assistant_message = AssistantMessage.objects.create(
            thread=thread,
            role=AssistantMessage.Role.ASSISTANT,
            content=reply_text,
        )
        thread.save(update_fields=['updated_at'])

        return Response(
            {
                'user_message': AssistantMessageSerializer(user_message).data,
                'assistant_message': AssistantMessageSerializer(assistant_message).data,
            },
            status=status.HTTP_201_CREATED,
        )


class StudentAssistantThreadListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_platform_admin(request.user) and request.user.role != UserRole.LEADER:
            return Response(
                {'detail': 'Оқушы чаттарын тек мұғалім көре алады.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = AssistantThreadSerializer(student_threads_for_user(request.user).order_by('-updated_at'), many=True)
        return Response(serializer.data)
