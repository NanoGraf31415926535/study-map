from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.viewsets import ViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta
from .serializers import RegisterSerializer, LoginSerializer, UserProfileSerializer, PasswordChangeSerializer

CustomUser = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = authenticate(username=user.username, password=password)
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if user.is_blocked:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        profile_serializer = UserProfileSerializer(user, context={'request': request})

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': profile_serializer.data
        })


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        return Response({'message': 'Password changed successfully'})


class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from projects.models import Project

        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        total_users = CustomUser.objects.count()
        total_projects = Project.objects.count()

        new_users_week = CustomUser.objects.filter(date_joined__gte=week_ago).count()
        new_users_month = CustomUser.objects.filter(date_joined__gte=month_ago).count()

        admin_count = CustomUser.objects.filter(is_staff=True).count()

        return Response({
            'total_users': total_users,
            'total_projects': total_projects,
            'new_users_week': new_users_week,
            'new_users_month': new_users_month,
            'admin_count': admin_count,
        })


class AdminUserListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = CustomUser.objects.all().order_by('-date_joined')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminUserManagementView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        is_admin = request.data.get('is_staff')
        if is_admin is not None:
            user.is_staff = is_admin
            user.save()
            return Response({'message': f'User {user.username} is now {"admin" if is_admin else "regular user"}'})

        is_blocked = request.data.get('is_blocked')
        if is_blocked is not None:
            user.is_blocked = is_blocked
            user.save()
            return Response({'message': f'User {user.username} is now {"blocked" if is_blocked else "unblocked"}'})

        return Response({'error': 'No valid fields to update'}, status=status.HTTP_400_BAD_REQUEST)


class AdminAPILogsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from users.models import APILog

        limit = int(request.query_params.get('limit', 100))
        offset = int(request.query_params.get('offset', 0))
        user_id = request.query_params.get('user_id')
        endpoint = request.query_params.get('endpoint')
        status_code = request.query_params.get('status_code')

        logs = APILog.objects.all()

        if user_id:
            logs = logs.filter(user_id=user_id)
        if endpoint:
            logs = logs.filter(endpoint__icontains=endpoint)
        if status_code:
            logs = logs.filter(status_code=status_code)

        total = logs.count()
        logs = logs[offset:offset + limit]

        return Response({
            'logs': [
                {
                    'id': log.id,
                    'username': log.username,
                    'endpoint': log.endpoint,
                    'method': log.method,
                    'status_code': log.status_code,
                    'response_time': log.response_time,
                    'timestamp': log.timestamp.isoformat(),
                    'ip_address': log.ip_address,
                }
                for log in logs
            ],
            'total': total,
            'limit': limit,
            'offset': offset,
        })