from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from projects.models import Project
from .models import MindMap
from .services import MindMapService


service = MindMapService()


class GenerateMindMapView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)

        result = service.generate_mindmap(project_id)
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        mindmap = MindMap.objects.create(
            project=project,
            title=result.get('label', 'Mind Map'),
            data=result
        )

        return Response({
            'id': mindmap.id,
            'title': mindmap.title,
            'data': mindmap.data,
            'generated_at': mindmap.generated_at
        })


class GetMindMapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        mindmaps = MindMap.objects.filter(project=project).values('id', 'title', 'generated_at')
        return Response(list(mindmaps))


class MindMapDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id, mindmap_id):
        mindmap = get_object_or_404(MindMap, id=mindmap_id, project_id=project_id, project__owner=request.user)
        return Response({
            'id': mindmap.id,
            'title': mindmap.title,
            'data': mindmap.data,
            'generated_at': mindmap.generated_at
        })