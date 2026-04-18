from datetime import datetime
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from projects.models import Project
from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatMessageSerializer
from .services import OpenRouterService


class ChatSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatSessionSerializer

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return ChatSession.objects.filter(project_id=project_id, project__owner=self.request.user)

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        mode = self.request.data.get('mode', 'strict')
        serializer.save(project_id=project_id, mode=mode, title=f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        for msg in instance.messages.all():
            msg.delete()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id, session_id):
        session = get_object_or_404(
            ChatSession,
            id=session_id,
            project_id=project_id,
            project__owner=request.user
        )

        content = request.data.get('content', '')
        if not content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_message = ChatMessage.objects.create(
            session=session,
            role='user',
            content=content
        )

        recent_messages = list(session.messages.order_by('created_at').values('role', 'content'))
        if len(recent_messages) > 20:
            recent_messages = recent_messages[-20:]

        chat_messages = [{'role': msg['role'], 'content': msg['content']} for msg in recent_messages]

        service = OpenRouterService()
        try:
            if session.mode == 'strict':
                result = service.chat_strict(chat_messages, project_id)
            elif session.mode == 'hybrid':
                result = service.chat_hybrid(chat_messages, project_id)
            else:
                result = service.chat_search(chat_messages, project_id)
        except Exception as e:
            import traceback
            traceback.print_exc()
            user_message.delete()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not session.title:
            session.title = content[:60] + ('...' if len(content) > 60 else '')
            session.save()

        assistant_message = ChatMessage.objects.create(
            session=session,
            role='assistant',
            content=result.get('content', ''),
            injected_thought=result.get('injected_thought', ''),
            sources=result.get('sources', []),
            web_sources=result.get('web_sources', [])
        )

        return Response({
            'user_message': ChatMessageSerializer(user_message).data,
            'assistant_message': ChatMessageSerializer(assistant_message).data
        })