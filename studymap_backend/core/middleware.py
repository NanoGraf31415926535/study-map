import time
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class APILogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, 'start_time') and request.path.startswith('/api/'):
            try:
                response_time = (time.time() - request.start_time) * 1000

                user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
                username = user.username if user else None

                status_code = response.status_code

                if status_code < 400:
                    from users.models import APILog
                    APILog.objects.create(
                        user=user,
                        username=username,
                        endpoint=request.path,
                        method=request.method,
                        status_code=status_code,
                        response_time=round(response_time, 2),
                        ip_address=self.get_client_ip(request),
                    )
            except Exception:
                pass

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')