"""URL routes for the trips app."""
from django.urls import path
from . import views

urlpatterns = [
    path("samples", views.list_samples, name="list-samples"),
    path("driver", views.driver_profile, name="driver-profile"),
    path("plan", views.plan, name="plan-trip"),
    path("plan/sample/<str:sample_id>", views.plan_sample, name="plan-sample"),
]
