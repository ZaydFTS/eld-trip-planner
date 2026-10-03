"""HTTP API endpoints for the ELD Trip Planner."""
from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from hos.planner import plan_trip
from hos.logs import DEFAULT_DRIVER


SAMPLE_TRIPS = [
    {
        "id": "midwest-intermodal",
        "name": "Midwest Intermodal",
        "current_location": "Chicago, IL",
        "pickup_location": "Joliet, IL",
        "dropoff_location": "Detroit, MI",
        "current_cycle_used_hours": 35.0,
        "label": "282 mi · 1-day run",
    },
    {
        "id": "texas-gulf-express",
        "name": "Texas Gulf Express",
        "current_location": "Dallas, TX",
        "pickup_location": "Houston, TX",
        "dropoff_location": "Galveston, TX",
        "current_cycle_used_hours": 20.0,
        "label": "239 mi · short haul",
    },
    {
        "id": "i10-southwest",
        "name": "I-10 Southwest",
        "current_location": "Los Angeles, CA",
        "pickup_location": "Palm Springs, CA",
        "dropoff_location": "Phoenix, AZ",
        "current_cycle_used_hours": 45.0,
        "label": "372 mi · desert corridor",
    },
]


@api_view(["GET"])
def list_samples(request):
    """List the sample trips shown on the landing page."""
    return Response({"samples": SAMPLE_TRIPS})


@api_view(["GET"])
def driver_profile(request):
    """Return the default driver/carrier profile."""
    return Response(DEFAULT_DRIVER)


@api_view(["POST"])
def plan(request):
    """
    POST /api/plan
    Body: {
      current_location: str,
      pickup_location: str,
      dropoff_location: str,
      current_cycle_used_hours: float (0-70),
    }
    Returns: full trip plan (route, schedule, daily_logs, summary, itinerary).
    """
    body = request.data or {}
    required = ("current_location", "pickup_location", "dropoff_location", "current_cycle_used_hours")
    missing = [k for k in required if not body.get(k) and body.get(k) != 0]
    if missing:
        return Response(
            {"error": "Missing required fields", "fields": missing},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        cycle_h = float(body["current_cycle_used_hours"])
        if cycle_h < 0 or cycle_h > 70:
            return Response(
                {"error": "current_cycle_used_hours must be between 0 and 70"},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except (ValueError, TypeError):
        return Response(
            {"error": "current_cycle_used_hours must be a number"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = plan_trip(
            current_location=body["current_location"].strip(),
            pickup_location=body["pickup_location"].strip(),
            dropoff_location=body["dropoff_location"].strip(),
            current_cycle_used_hours=cycle_h,
        )
        return Response(result)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": f"Trip planning failed: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def plan_sample(request, sample_id):
    """GET /api/plan/sample/<id> — plan a sample trip directly."""
    match = next((s for s in SAMPLE_TRIPS if s["id"] == sample_id), None)
    if not match:
        return Response({"error": "Unknown sample"}, status=status.HTTP_404_NOT_FOUND)
    try:
        result = plan_trip(
            current_location=match["current_location"],
            pickup_location=match["pickup_location"],
            dropoff_location=match["dropoff_location"],
            current_cycle_used_hours=match["current_cycle_used_hours"],
        )
        return Response(result)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


urlpatterns = [
    path("samples", list_samples, name="list-samples"),
    path("driver", driver_profile, name="driver-profile"),
    path("plan", plan, name="plan-trip"),
    path("plan/sample/<str:sample_id>", plan_sample, name="plan-sample"),
]
