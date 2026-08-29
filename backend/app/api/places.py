from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from backend.app.data.places import OSMPlace, fetch_osm_places


def fetch_places_for_bbox(
    south: float,
    west: float,
    north: float,
    east: float,
    endpoint: str = "https://overpass-api.de/api/interpreter",
    api_key: Optional[str] = None,
) -> List[OSMPlace]:
    return fetch_osm_places(bbox=(south, west, north, east), endpoint=endpoint, api_key=api_key)


def fetch_places_around(
    lat: float,
    lon: float,
    radius: int = 500,
    endpoint: str = "https://overpass-api.de/api/interpreter",
    api_key: Optional[str] = None,
) -> List[OSMPlace]:
    return fetch_osm_places(around=(lat, lon, radius), endpoint=endpoint, api_key=api_key)


def build_route_payload(
    start: Dict[str, float],
    destination: Dict[str, float],
    places: Optional[List[OSMPlace]] = None,
    preferences: Optional[Dict[str, float]] = None,
    requirements: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "start": start,
        "destination": destination,
        "preferences": preferences or {},
        "requirements": requirements or {},
        "osm_places": [place.to_dict() for place in (places or [])],
    }
