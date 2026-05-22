from django.contrib import admin

from .models import AssistantMessage, AssistantThread


@admin.register(AssistantThread)
class AssistantThreadAdmin(admin.ModelAdmin):
    list_display = ('id', 'owner', 'title', 'updated_at')
    list_filter = ('updated_at',)
    search_fields = ('owner__username', 'title')


@admin.register(AssistantMessage)
class AssistantMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'thread', 'role', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('content', 'thread__owner__username', 'thread__title')
