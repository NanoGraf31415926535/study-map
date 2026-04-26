from rest_framework import serializers


class CheatsheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = None
        fields = ['id', 'title', 'content', 'is_auto_generated', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CheatsheetCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    content = serializers.JSONField(required=True)


class CheatsheetUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False)
    content = serializers.JSONField(required=False)