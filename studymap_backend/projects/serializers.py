from rest_framework import serializers
from .models import Project, Document, Note


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'file_type', 'page_count',
            'word_count', 'is_processed', 'processing_error', 'uploaded_at'
        ]
        read_only_fields = ['id', 'file_type', 'page_count', 'word_count', 'is_processed', 'processing_error', 'uploaded_at']
        extra_kwargs = {'title': {'required': False, 'allow_blank': True}}


class DocumentDetailSerializer(DocumentSerializer):
    class Meta(DocumentSerializer.Meta):
        fields = DocumentSerializer.Meta.fields + ['raw_text']


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectSerializer(serializers.ModelSerializer):
    document_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'color', 'created_at',
            'updated_at', 'is_archived', 'document_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_document_count(self, obj):
        return obj.documents.count()