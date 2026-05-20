from django.db import models
from django.conf import settings
from core.models import Faction

class TaskStatus(models.TextChoices):
    TODO = 'todo', 'To Study'
    IN_PROGRESS = 'in_progress', 'In Progress'
    REVIEW = 'review', 'On Review'
    DONE = 'done', 'Done'

class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    faction = models.CharField(
        max_length=20,
        choices=Faction.choices
    )
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deadline = models.DateTimeField(null=True, blank=True)
    
    # For the 3-day marker mentioned in plan
    started_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title


class ProgramKind(models.TextChoices):
    DIAGNOSTIC = 'diagnostic', 'Diagnostic'
    LESSON = 'lesson', 'Lesson'
    QUIZ = 'quiz', 'Quiz'
    CONTEST = 'contest', 'Contest'
    PROJECT = 'project', 'Project'


class ProgramResourceKind(models.TextChoices):
    ARTICLE = 'article', 'Article'
    VIDEO = 'video', 'Video'
    PRACTICE = 'practice', 'Practice'
    DOCS = 'docs', 'Documentation'
    TOOL = 'tool', 'Tool'
    BOOK = 'book', 'Book'


class ProgramTrack(models.Model):
    id = models.SlugField(primary_key=True, max_length=80)
    title = models.CharField(max_length=255)
    faction = models.CharField(max_length=20, choices=Faction.choices, default=Faction.NONE)
    level = models.CharField(max_length=120, blank=True)
    lessons = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)
    outcomes = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'title']

    def __str__(self):
        return self.title


class ProgramItem(models.Model):
    id = models.SlugField(primary_key=True, max_length=100)
    track = models.ForeignKey(
        ProgramTrack,
        on_delete=models.CASCADE,
        related_name='items',
    )
    kind = models.CharField(max_length=20, choices=ProgramKind.choices, default=ProgramKind.LESSON)
    title = models.CharField(max_length=255)
    duration_minutes = models.PositiveIntegerField(default=45)
    description = models.TextField(blank=True)
    topics = models.JSONField(default=list, blank=True)
    practice = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['track__order', 'order', 'title']

    def __str__(self):
        return self.title


class ProgramResource(models.Model):
    id = models.SlugField(primary_key=True, max_length=120)
    item = models.ForeignKey(
        ProgramItem,
        on_delete=models.CASCADE,
        related_name='resources',
    )
    kind = models.CharField(max_length=20, choices=ProgramResourceKind.choices, default=ProgramResourceKind.ARTICLE)
    title = models.CharField(max_length=255)
    url = models.URLField(max_length=600)
    source = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['item__track__order', 'item__order', 'order', 'title']

    def __str__(self):
        return self.title


class DailyStandup(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='standups'
    )
    date = models.DateField(auto_now_add=True)
    what_done = models.TextField()
    difficulties = models.TextField()
    plan_next = models.TextField()

    def __str__(self):
        return f"Standup {self.user.username} - {self.date}"
