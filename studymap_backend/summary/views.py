from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from projects.models import Project
from .services import SummaryService
from .models import Summary


service = SummaryService()


class GenerateSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        summary_type = request.data.get('type', 'cornell')

        if summary_type not in ['cornell', 'study', 'research']:
            return Response({'error': 'Type must be cornell, study, or research'}, status=status.HTTP_400_BAD_REQUEST)

        result = service.generate_summary(project_id, summary_type)
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        summary = Summary.objects.create(
            project=project,
            type=summary_type,
            title=result.get('title', ''),
            data=result
        )

        return Response(result)

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        summaries = Summary.objects.filter(project=project).values('id', 'type', 'title', 'generated_at')
        return Response(list(summaries))


class SummaryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id, summary_id):
        summary = get_object_or_404(Summary, id=summary_id, project_id=project_id, project__owner=request.user)
        return Response(summary.data)