"""
URL configuration for eld_trip_planner_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def health(request):
    return JsonResponse({"status": "ok", "service": "eld-trip-planner-backend", "version": "1.0"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health', health, name='health'),
    path('api/', include('trips.urls')),
]
