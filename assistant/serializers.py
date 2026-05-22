from rest_framework import serializers

from core.serializers import UserSerializer
from .models import AssistantMessage, AssistantThread


class AssistantMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistantMessage
        fields = ('id', 'thread', 'role', 'content', 'created_at')
        read_only_fields = ('id', 'thread', 'role', 'created_at')


class AssistantThreadSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    latest_message = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()

    class Meta:
        model = AssistantThread
        fields = (
            'id',
            'owner',
            'owner_details',
            'title',
            'latest_message',
            'messages_count',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'owner', 'owner_details', 'latest_message', 'messages_count', 'created_at', 'updated_at')

    def get_latest_message(self, obj):
        message = getattr(obj, 'latest_message_obj', None) or obj.messages.order_by('-created_at').first()
        if not message:
            return None
        return AssistantMessageSerializer(message).data

    def get_messages_count(self, obj):
        return getattr(obj, 'messages_count', None) or obj.messages.count()


class AssistantMessageCreateSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=4000, trim_whitespace=True)
