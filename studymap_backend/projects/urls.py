from django.urls import path
from .views import ProjectViewSet, DocumentViewSet, NoteViewSet

app_name = 'projects'

urlpatterns = [
    path('projects/', ProjectViewSet.as_view({'get': 'list', 'post': 'create'}), name='project-list'),
    path('projects/<int:pk>/', ProjectViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='project-detail'),
    path('projects/<int:project_id>/documents/', DocumentViewSet.as_view({'get': 'list', 'post': 'create'}), name='project-documents'),
    path('projects/<int:project_id>/documents/<int:pk>/', DocumentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='project-document-detail'),
    path('projects/<int:project_id>/notes/', NoteViewSet.as_view({'get': 'list', 'post': 'create'}), name='project-notes'),
    path('projects/<int:project_id>/notes/<int:pk>/', NoteViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='project-note-detail'),
]