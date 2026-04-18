from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/', include('projects.urls', namespace='projects')),
    path('api/', include('chat.urls')),
    path('api/', include('generation.urls')),
    path('api/', include('mindmap.urls')),
    path('api/', include('summary.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)