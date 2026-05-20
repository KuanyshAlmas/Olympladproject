from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    SUPERUSER = 'superuser', 'Superuser'
    LEADER = 'leader', 'Group Leader'
    STUDENT = 'student', 'Student'

class Faction(models.TextChoices):
    INFORMATICS = 'informatics', 'Informatics'
    ROBOTICS = 'robotics', 'Robotics'
    NONE = 'none', 'None'

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT
    )
    faction = models.CharField(
        max_length=20,
        choices=Faction.choices,
        default=Faction.NONE
    )
    social_gpa = models.FloatField(default=0.0)
    focus_points = models.IntegerField(default=0)
    
    # Pomodoro / Live status
    is_online = models.BooleanField(default=False)
    pomodoro_status = models.CharField(
        max_length=20,
        choices=[('idle', 'Idle'), ('focus', 'Focusing'), ('break', 'On Break')],
        default='idle'
    )
    pomodoro_end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()} - {self.get_faction_display()})"


class PomodoroSession(models.Model):
    class Mode(models.TextChoices):
        FOCUS = 'focus', 'Focus'
        BREAK = 'break', 'Break'

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='pomodoro_sessions'
    )
    mode = models.CharField(max_length=12, choices=Mode.choices, default=Mode.FOCUS)
    duration_minutes = models.PositiveIntegerField(default=25)
    completed = models.BooleanField(default=True)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-ended_at']

    def __str__(self):
        return f"{self.user.username} - {self.mode} ({self.duration_minutes}m)"
