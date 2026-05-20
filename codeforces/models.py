from django.conf import settings
from django.db import models


class CodeforcesProblemStatement(models.Model):
    contest_id = models.PositiveIntegerField()
    index = models.CharField(max_length=12)
    name = models.CharField(max_length=255, blank=True)
    statement_text = models.TextField()
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_codeforces_statements',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('contest_id', 'index')
        ordering = ['contest_id', 'index']

    def __str__(self):
        return f'{self.contest_id}{self.index}. {self.name or "Codeforces problem"}'


class CodeforcesSolution(models.Model):
    class Status(models.TextChoices):
        TODO = 'todo', 'To Solve'
        SOLVING = 'solving', 'Solving'
        SOLVED = 'solved', 'Solved'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='codeforces_solutions'
    )
    contest_id = models.IntegerField()
    index = models.CharField(max_length=12)
    name = models.CharField(max_length=255)
    rating = models.IntegerField(null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    language = models.CharField(max_length=50, default='GNU C++17')
    solution_code = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'contest_id', 'index')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username}: {self.contest_id}{self.index} {self.name}"
