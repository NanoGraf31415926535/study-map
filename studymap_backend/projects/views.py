import os
import signal
import threading
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Project, Document, Note
from .serializers import (
    ProjectSerializer,
    DocumentSerializer,
    DocumentDetailSerializer,
    NoteSerializer,
)
from .parsers import DocumentParser

parser = DocumentParser()

PROCESSING_TIMEOUT = 30


class TimeoutError(Exception):
    pass


def timeout_handler(signum, frame):
    raise TimeoutError("Processing timed out")


def parse_document_with_timeout(file_path, file_type):
    result = {'raw_text': '', 'page_count': 0, 'error': None}

    def parse():
        try:
            if file_type == 'pdf':
                raw_text, page_count = parser.parse_pdf(file_path)
                result['raw_text'] = raw_text
                result['page_count'] = page_count
            elif file_type == 'pptx':
                raw_text, page_count = parser.parse_pptx(file_path)
                result['raw_text'] = raw_text
                result['page_count'] = page_count
            else:
                result['raw_text'] = parser.parse(file_path, file_type)
        except Exception as e:
            result['error'] = e

    t = threading.Thread(target=parse)
    t.daemon = True
    t.start()
    t.join(timeout=PROCESSING_TIMEOUT)

    if t.is_alive():
        result['error'] = TimeoutError("Processing timed out after {} seconds".format(PROCESSING_TIMEOUT))
    elif result['error']:
        if isinstance(result['error'], TimeoutError):
            raise result['error']
        raise result['error']

    return result['raw_text'], result['page_count']


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        for doc in instance.documents.all():
            if doc.file:
                try:
                    if os.path.exists(doc.file.path):
                        os.remove(doc.file.path)
                except Exception:
                    pass
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return Document.objects.filter(project_id=project_id, project__owner=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DocumentDetailSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get('project_id'))

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file_type = parser.detect_file_type(file_obj.name)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        title = serializer.validated_data.get('title')
        if not title:
            title = os.path.splitext(file_obj.name)[0]
        doc = serializer.save(
            project_id=self.kwargs.get('project_id'),
            file_type=file_type,
            title=title
        )

        try:
            file_path = doc.file.path
            raw_text, page_count = parse_document_with_timeout(file_path, file_type)
            doc.page_count = page_count if file_type in ['pdf', 'pptx'] else 0

            doc.raw_text = raw_text
            doc.word_count = len(raw_text.split()) if raw_text else 0
            doc.is_processed = True
            doc.save()

        except Exception as e:
            doc.is_processed = False
            doc.processing_error = str(e)
            doc.save()
            return Response(
                {
                    'id': doc.id,
                    'title': doc.title,
                    'file_type': doc.file_type,
                    'is_processed': False,
                    'processing_error': doc.processing_error,
                },
                status=207
            )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['patch'])
    def reprocess(self, request, pk=None):
        doc = self.get_object()
        try:
            file_path = doc.file.path
            file_type = doc.file_type

            if file_type == 'pdf':
                raw_text, page_count = parser.parse_pdf(file_path)
                doc.page_count = page_count
            elif file_type == 'pptx':
                raw_text, page_count = parser.parse_pptx(file_path)
                doc.page_count = page_count
            else:
                raw_text = parser.parse(file_path, file_type)
                if file_type in ['docx', 'txt']:
                    doc.page_count = 0

            doc.raw_text = raw_text
            doc.word_count = len(raw_text.split()) if raw_text else 0
            doc.is_processed = True
            doc.processing_error = ''
            doc.save()
            return Response({
                'id': doc.id,
                'title': doc.title,
                'is_processed': True,
                'word_count': doc.word_count,
                'page_count': doc.page_count,
            })

        except Exception as e:
            doc.raw_text = ''
            doc.is_processed = False
            doc.processing_error = str(e)
            doc.save()
            return Response({
                'id': doc.id,
                'title': doc.title,
                'is_processed': False,
                'processing_error': str(e),
            }, status=207)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.file:
            try:
                if os.path.exists(instance.file.path):
                    os.remove(instance.file.path)
            except Exception:
                pass
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class NoteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NoteSerializer

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return Note.objects.filter(project_id=project_id, project__owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get('project_id'))