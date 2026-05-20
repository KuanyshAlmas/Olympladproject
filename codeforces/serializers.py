from rest_framework import serializers

from core.serializers import UserSerializer

from .models import CodeforcesSolution


class CodeforcesSolutionSerializer(serializers.ModelSerializer):
    problem_url = serializers.SerializerMethodField()
    submit_url = serializers.SerializerMethodField()
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = CodeforcesSolution
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

    def get_problem_url(self, obj):
        return f"https://codeforces.com/problemset/problem/{obj.contest_id}/{obj.index}"

    def get_submit_url(self, obj):
        return f"https://codeforces.com/problemset/submit/{obj.contest_id}/{obj.index}"

    def create(self, validated_data):
        user = self.context['request'].user
        solution, _ = CodeforcesSolution.objects.update_or_create(
            user=user,
            contest_id=validated_data['contest_id'],
            index=validated_data['index'],
            defaults=validated_data,
        )
        return solution
