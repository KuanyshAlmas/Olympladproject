from django.db import models
from django.conf import settings

class EventCategory(models.TextChoices):
    OLYMPIAD = 'olympiad', 'Olympiad/Tournament'
    INTERNAL = 'internal', 'Internal Meeting/Hackathon'
    SCHOOL = 'school', 'School Activity'

class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=EventCategory.choices,
        default=EventCategory.INTERNAL
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    poster = models.ImageField(upload_to='events/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_pinned = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class RSVP(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rsvps'
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendees')
    is_attending = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'event')
