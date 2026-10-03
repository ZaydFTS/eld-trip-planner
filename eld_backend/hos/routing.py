"""
Routing service — geocodes place names via Nominatim (OpenStreetMap),
and computes driving routes via the public OSRM API.

Both are FREE and require no API key. Rate limits:
  - Nominatim: 1 req/sec (we only call a handful of times per trip)
  - OSRM public router: rate-limited but adequate for low-volume use
"""
from __future__ import annotations

import time
import urllib.parse
from typing import Dict, List, Optional, Tuple

import requests
from django.conf import settings


# Cache for the lifetime of the process — geocoding results rarely change
_GEOCODE_CACHE: Dict[str, Dict] = {}
_ROUTE_CACHE: Dict[str, Dict] = {}


def geocode(place: str) -> Dict:
    """
    Convert a place name (e.g. "Chicago, IL") into lat/lng/display_name.
    Returns {name, lat, lon, display_name} or raises ValueError.
    """
    if place in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[place]

    base = settings.NOMINATIM_BASE_URL
    q = urllib.parse.quote(place)
    url = f"{base}/search?q={q}&format=json&limit=1&countrycodes=us"
    headers = {"User-Agent": "ELD-Trip-Planner/1.0 (assessment project)"}
    r = requests.get(url, headers=headers, timeout=15)
    r.raise_for_status()
    data = r.json()
    if not data:
        raise ValueError(f"Geocoding failed for '{place}' — no result from Nominatim.")

    hit = data[0]
    result = {
        "name": place,
        "lat": float(hit["lat"]),
        "lon": float(hit["lon"]),
        "display_name": hit["display_name"],
    }
    _GEOCODE_CACHE[place] = result
    return result


def get_route(waypoints: List[Dict]) -> Dict:
    """
    Get a driving route through an ordered list of {lat, lon, name} waypoints.
    Returns {distance_m, duration_s, geometry: [[lon,lat],...], legs: [...]}.

    Uses the public OSRM demo server (router.project-osrm.org).
    """
    key = "->".join(f"{w['lat']:.5f},{w['lon']:.5f}" for w in waypoints)
    if key in _ROUTE_CACHE:
        return _ROUTE_CACHE[key]

    coord_str = ";".join(f"{w['lon']:.6f},{w['lat']:.6f}" for w in waypoints)
    url = (
        f"{settings.OSRM_BASE_URL}/route/v1/driving/{coord_str}"
        f"?overview=full&geometries=geojson&steps=false&annotations=false"
    )
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    data = r.json()
    if data.get("code") != "Ok" or not data.get("routes"):
        raise ValueError(f"OSRM routing failed: {data.get('code')} / {data.get('message', '')}")

    route = data["routes"][0]
    result = {
        "distance_m": route["distance"],
        "duration_s": route["duration"],
        "geometry": route["geometry"]["coordinates"],   # [[lon, lat], ...]
        "legs": [
            {
                "distance_m": leg["distance"],
                "duration_s": leg["duration"],
                "from_name": waypoints[i]["name"],
                "to_name": waypoints[i + 1]["name"],
            }
            for i, leg in enumerate(route["legs"])
        ],
    }
    _ROUTE_CACHE[key] = result
    return result


def meters_to_miles(m: float) -> float:
    return m / 1609.344


def seconds_to_minutes(s: float) -> float:
    return s / 60.0
