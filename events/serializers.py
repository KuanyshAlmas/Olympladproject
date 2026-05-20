from rest_framework import serializers
from .models import Event, RSVP
from core.serializers import UserSerializer

class EventSerializer(serializers.ModelSerializer):
    attendees_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'

    def get_attendees_count(self, obj):
        return obj.attendees.filter(is_attending=True).count()

class RSVPSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = RSVP
        fields = '__all__'
        read_only_fields = ('user',)
