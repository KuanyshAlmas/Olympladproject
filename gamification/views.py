from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Skill, UserSkill, Duel
from .serializers import SkillSerializer, UserSkillSerializer, DuelSerializer
from core.models import UserRole

class SkillViewSet(viewsets.ModelViewSet):
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.SUPERUSER:
            return Skill.objects.all()
        return Skill.objects.filter(faction=user.faction)

class UserSkillViewSet(viewsets.ModelViewSet):
    serializer_class = UserSkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.SUPERUSER:
            return UserSkill.objects.all()
        if user.role == UserRole.LEADER:
            return UserSkill.objects.filter(user__faction=user.faction)
        return UserSkill.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DuelViewSet(viewsets.ModelViewSet):
    serializer_class = DuelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Duel.objects.filter(models.Q(challenger=user) | models.Q(opponent=user))

    def perform_create(self, serializer):
        serializer.save(challenger=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        duel = self.get_object()
        if duel.opponent != request.user:
            return Response({'detail': 'Not your duel to accept.'}, status=status.HTTP_403_FORBIDDEN)
        duel.status = Duel.Status.ACTIVE
        duel.save()
        return Response({'status': 'duel accepted'})
