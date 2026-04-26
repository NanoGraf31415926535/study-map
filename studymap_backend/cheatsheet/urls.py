from django.urls import path
from .views import (
    CheatsheetListCreateView,
    CheatsheetDetailView,
    GenerateCheatsheetView
)

app_name = 'cheatsheet'

urlpatterns = [
    path('projects/<int:project_id>/cheatsheets/', CheatsheetListCreateView.as_view(), name='cheatsheet-list'),
    path('projects/<int:project_id>/cheatsheets/generate/', GenerateCheatsheetView.as_view(), name='generate-cheatsheet'),
    path('projects/<int:project_id>/cheatsheets/<int:cheatsheet_id>/', CheatsheetDetailView.as_view(), name='cheatsheet-detail'),
]