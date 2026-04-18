from django.urls import path
from .views import GenerateSummaryView, SummaryDetailView

app_name = 'summary'

urlpatterns = [
    path('projects/<int:project_id>/summary/generate/', GenerateSummaryView.as_view(), name='generate-summary'),
    path('projects/<int:project_id>/summary/<int:summary_id>/', SummaryDetailView.as_view(), name='summary-detail'),
]