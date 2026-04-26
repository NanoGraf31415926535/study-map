from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from projects.models import Project
from .models import Cheatsheet
from .services import service


class CheatsheetListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        cheatsheets = Cheatsheet.objects.filter(project=project).values(
            'id', 'title', 'content', 'is_auto_generated', 'created_at', 'updated_at'
        )
        return Response(list(cheatsheets))

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        title = request.data.get('title', '')
        content = request.data.get('content', {})

        if not content:
            return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)

        cheatsheet = Cheatsheet.objects.create(
            project=project,
            title=title,
            content=content,
            is_auto_generated=False
        )

        return Response({
            'id': cheatsheet.id,
            'title': cheatsheet.title,
            'content': cheatsheet.content,
            'is_auto_generated': cheatsheet.is_auto_generated,
            'created_at': cheatsheet.created_at,
            'updated_at': cheatsheet.updated_at
        }, status=status.HTTP_201_CREATED)


class CheatsheetDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id, cheatsheet_id):
        cheatsheet = get_object_or_404(
            Cheatsheet,
            id=cheatsheet_id,
            project_id=project_id,
            project__owner=request.user
        )
        return Response({
            'id': cheatsheet.id,
            'title': cheatsheet.title,
            'content': cheatsheet.content,
            'is_auto_generated': cheatsheet.is_auto_generated,
            'created_at': cheatsheet.created_at,
            'updated_at': cheatsheet.updated_at
        })

    def put(self, request, project_id, cheatsheet_id):
        cheatsheet = get_object_or_404(
            Cheatsheet,
            id=cheatsheet_id,
            project_id=project_id,
            project__owner=request.user
        )

        title = request.data.get('title')
        content = request.data.get('content')

        if title is not None:
            cheatsheet.title = title
        if content is not None:
            cheatsheet.content = content

        cheatsheet.save()

        return Response({
            'id': cheatsheet.id,
            'title': cheatsheet.title,
            'content': cheatsheet.content,
            'is_auto_generated': cheatsheet.is_auto_generated,
            'created_at': cheatsheet.created_at,
            'updated_at': cheatsheet.updated_at
        })

    def patch(self, request, project_id, cheatsheet_id):
        return self.put(request, project_id, cheatsheet_id)

    def delete(self, request, project_id, cheatsheet_id):
        cheatsheet = get_object_or_404(
            Cheatsheet,
            id=cheatsheet_id,
            project_id=project_id,
            project__owner=request.user
        )
        cheatsheet.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GenerateCheatsheetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)

        result = service.generate_cheatsheet(project_id)
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        cheatsheet = Cheatsheet.objects.create(
            project=project,
            title=result.get('title', ''),
            content=result,
            is_auto_generated=True
        )

        return Response({
            'id': cheatsheet.id,
            'title': cheatsheet.title,
            'content': cheatsheet.content,
            'is_auto_generated': cheatsheet.is_auto_generated,
            'created_at': cheatsheet.created_at,
            'updated_at': cheatsheet.updated_at
        }, status=status.HTTP_201_CREATED)