import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize ASGI application early to ensure the app registry is loaded
django_asgi_app = get_asgi_application()

# We will import consumers later to avoid circular imports during startup
from core.middleware import JWTAuthMiddleware
from tasks.consumers import TaskConsumer
from core.consumers import PresenceConsumer

urlpatterns = [
    path('ws/tasks/<str:faction>/', TaskConsumer.as_asgi()),
    path('ws/presence/', PresenceConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            urlpatterns
        )
    ),
})
