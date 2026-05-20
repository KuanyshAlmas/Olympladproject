from rest_framework import serializers
from .models import DailyStandup, ProgramItem, ProgramResource, ProgramTrack, Task
from core.serializers import UserSerializer

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'

class DailyStandupSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = DailyStandup
        fields = '__all__'
        read_only_fields = ('user',)


class ProgramTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramTrack
        fields = '__all__'


class ProgramResourceSerializer(serializers.ModelSerializer):
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=ProgramItem.objects.all(),
        source='item',
    )

    class Meta:
        model = ProgramResource
        fields = (
            'id',
            'item_id',
            'kind',
            'title',
            'url',
            'source',
            'description',
            'order',
            'is_active',
            'created_at',
            'updated_at',
        )


class ProgramItemSerializer(serializers.ModelSerializer):
    track_id = serializers.PrimaryKeyRelatedField(
        queryset=ProgramTrack.objects.all(),
        source='track',
    )
    track = ProgramTrackSerializer(read_only=True)
    resources = serializers.SerializerMethodField()

    class Meta:
        model = ProgramItem
        fields = '__all__'

    def get_resources(self, obj):
        request = self.context.get('request')
        queryset = obj.resources.all()
        if request and not (
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'superuser' or request.user.is_staff or request.user.is_superuser)
        ):
            queryset = queryset.filter(is_active=True)
        return ProgramResourceSerializer(queryset.order_by('order', 'title'), many=True).data
