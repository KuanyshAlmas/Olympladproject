from django.contrib import admin

from .models import CodeforcesProblemStatement, CodeforcesSolution


@admin.register(CodeforcesProblemStatement)
class CodeforcesProblemStatementAdmin(admin.ModelAdmin):
    list_display = ('contest_id', 'index', 'name', 'updated_by', 'updated_at')
    search_fields = ('contest_id', 'index', 'name', 'statement_text')
    list_filter = ('updated_at',)


@admin.register(CodeforcesSolution)
class CodeforcesSolutionAdmin(admin.ModelAdmin):
    list_display = ('user', 'contest_id', 'index', 'name', 'status', 'updated_at')
    search_fields = ('user__username', 'contest_id', 'index', 'name')
    list_filter = ('status', 'language', 'updated_at')
