from django.contrib import admin

from .models import DailyStandup, ProgramItem, ProgramResource, ProgramTrack, Task


@admin.register(ProgramTrack)
class ProgramTrackAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'faction', 'lessons', 'order', 'is_active')
    list_filter = ('faction', 'is_active')
    search_fields = ('id', 'title', 'description')


@admin.register(ProgramItem)
class ProgramItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'track', 'kind', 'duration_minutes', 'order', 'is_active')
    list_filter = ('track', 'kind', 'is_active')
    search_fields = ('id', 'title', 'description', 'topics', 'practice')


@admin.register(ProgramResource)
class ProgramResourceAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'item', 'kind', 'source', 'order', 'is_active')
    list_filter = ('kind', 'source', 'is_active')
    search_fields = ('id', 'title', 'url', 'description', 'source')


admin.site.register(Task)
admin.site.register(DailyStandup)
