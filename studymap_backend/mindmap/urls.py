from django.urls import path
from .views import GenerateMindMapView, GetMindMapView, MindMapDetailView

app_name = 'mindmap'

urlpatterns = [
    path('projects/<int:project_id>/mindmap/generate/', GenerateMindMapView.as_view(), name='generate-mindmap'),
    path('projects/<int:project_id>/mindmap/', GetMindMapView.as_view(), name='get-mindmap'),
    path('projects/<int:project_id>/mindmap/<int:mindmap_id>/', MindMapDetailView.as_view(), name='mindmap-detail'),
]