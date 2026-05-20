from rest_framework import permissions

from .models import UserRole


def is_platform_admin(user):
    return bool(
        user
        and user.is_authenticated
        and (user.role == UserRole.SUPERUSER or user.is_staff or user.is_superuser)
    )


class IsPlatformAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        return is_platform_admin(request.user)
