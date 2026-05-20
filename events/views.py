from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsPlatformAdminOrReadOnly
from .models import Event, RSVP
from .serializers import EventSerializer, RSVPSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-is_pinned', 'start_time')
    serializer_class = EventSerializer
    permission_classes = [IsPlatformAdminOrReadOnly]

    @action(detail=True, methods=['post'])
    def rsvp(self, request, pk=None):
        event = self.get_object()
        is_attending = request.data.get('is_attending', True)
        rsvp, created = RSVP.objects.update_or_create(
            user=request.user,
            event=event,
            defaults={'is_attending': is_attending}
        )
        return Response({'status': 'rsvp updated', 'is_attending': is_attending})

class RSVPViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RSVPSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RSVP.objects.filter(user=self.request.user)
