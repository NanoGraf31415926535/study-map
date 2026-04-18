from django.urls import path
from .views import ChatSessionViewSet, ChatMessageView

app_name = 'chat'

urlpatterns = [
    path('projects/<int:project_id>/sessions/', ChatSessionViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='chat-sessions'),
    path('projects/<int:project_id>/sessions/<int:pk>/', ChatSessionViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='chat-session-detail'),
    path('projects/<int:project_id>/sessions/<int:session_id>/message/', ChatMessageView.as_view(), name='chat-message'),
]