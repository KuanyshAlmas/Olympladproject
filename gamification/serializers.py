from rest_framework import serializers
from .models import Skill, UserSkill, Duel
from core.serializers import UserSerializer

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'

class UserSkillSerializer(serializers.ModelSerializer):
    skill_details = SkillSerializer(source='skill', read_only=True)

    class Meta:
        model = UserSkill
        fields = '__all__'
        read_only_fields = ('user',)

class DuelSerializer(serializers.ModelSerializer):
    challenger_details = UserSerializer(source='challenger', read_only=True)
    opponent_details = UserSerializer(source='opponent', read_only=True)
    winner_details = UserSerializer(source='winner', read_only=True)

    class Meta:
        model = Duel
        fields = '__all__'
        read_only_fields = ('challenger', 'status', 'winner')
