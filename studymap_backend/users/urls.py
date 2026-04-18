from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework import permissions
from .views import (
    RegisterView, LoginView, LogoutView, ProfileView,
    PasswordChangeView, AdminAnalyticsView, AdminUserListView,
    AdminUserManagementView
)

class TokenRefreshViewNoAuth(TokenRefreshView):
    permission_classes = [permissions.AllowAny]

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshViewNoAuth.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/password/', PasswordChangeView.as_view(), name='password-change'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:user_id>/', AdminUserManagementView.as_view(), name='admin-user-management'),
]