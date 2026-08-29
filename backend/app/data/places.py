from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import requests

DEFAULT_OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter"
FALLBACK_OVERPASS_ENDPOINT = "https://overpass.private.coffee/api/interpreter"


@dataclass
class OSMPlace:
    id: str
    type: str
    name: str
    lat: float
    lng: float
    tags: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_element(cls, element: Dict[str, Any]) -> "OSMPlace":
        tags = element.get("tags") or {}
        geo = element.get("center") or element
        lat = float(geo.get("lat", 0.0))
        lng = float(geo.get("lon", geo.get("lng", 0.0)))
        place_type = cls._detect_type(tags)
        name = str(tags.get("name") or tags.get("operator") or f"{place_type}_{element.get('id', 'unknown')}")
        return cls(
            id=str(element.get("id", name)),
            type=place_type,
            name=name,
            lat=lat,
            lng=lng,
            tags=tags,
        )

    @staticmethod
    def _detect_type(tags: Dict[str, Any]) -> str:
        amenity = tags.get("amenity")
        if amenity == "toilets":
            return "toilet"
        if amenity in {"drinking_water", "water_point"} or tags.get("man_made") == "drinking_fountain":
            return "water"
        if amenity == "bench":
            return "bench"
        if tags.get("natural") in {"tree", "tree_row"} or tags.get("landuse") in {"forest", "wood"}:
            return "tree"
        return "poi"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "name": self.name,
            "lat": self.lat,
            "lng": self.lng,
            "tags": self.tags,
        }


def build_overpass_query(
    bbox: Optional[Tuple[float, float, float, float]] = None,
    around: Optional[Tuple[float, float, int]] = None,
    extra_tags: Optional[Sequence[str]] = None,
) -> str:
    query_tags = list(extra_tags or [])
    if not query_tags:
        query_tags = [
            'node["amenity"="toilets"]({{bbox}});',
            'way["amenity"="toilets"]({{bbox}});',
            'node["natural"="tree"]({{bbox}});',
            'node["natural"="tree_row"]({{bbox}});',
            'node["amenity"="drinking_water"]({{bbox}});',
            'node["amenity"="bench"]({{bbox}});',
            'node["man_made"="drinking_fountain"]({{bbox}});',
            'way["amenity"="bench"]({{bbox}});',
        ]

    if bbox is not None:
        south, west, north, east = bbox
        bbox_clause = f"{south},{west},{north},{east}"
        prepared = [segment.replace("{{bbox}}", bbox_clause) for segment in query_tags]
        return "[out:json][timeout:25];\n(\n  " + "\n  ".join(prepared) + "\n);\nout center body;\n>;\nout skel qt;"

    if around is not None:
        lat, lon, radius = around
        prepared = [segment.replace("{{bbox}}", f"around:{radius},{lat},{lon}") for segment in query_tags]
        return "[out:json][timeout:25];\n(\n  " + "\n  ".join(prepared) + "\n);\nout center body;\n>;\nout skel qt;"

    raise ValueError("Either bbox or around must be supplied")


def get_overpass_endpoints() -> List[str]:
    candidates: List[str] = []
    env_endpoint = os.getenv("OVERPASS_ENDPOINT")
    if env_endpoint:
        candidates.append(env_endpoint)

    candidates.append(DEFAULT_OVERPASS_ENDPOINT)
    if FALLBACK_OVERPASS_ENDPOINT not in candidates:
        candidates.append(FALLBACK_OVERPASS_ENDPOINT)
    return candidates


def _request_headers() -> Dict[str, str]:
    return {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "CanopySpineHackathonApp/1.0",
    }


def fetch_overpass_json(
    query: str,
    endpoint: Optional[str] = None,
    api_key: Optional[str] = None,
    timeout: int = 30,
) -> Dict[str, Any]:
    del api_key
    endpoints = [endpoint] if endpoint else get_overpass_endpoints()
    headers = _request_headers()
    last_exc: Optional[Exception] = None

    for attempt in range(4):
        for current_endpoint in endpoints:
            try:
                response = requests.post(current_endpoint, data=query, headers=headers, timeout=timeout)
                if response.status_code in {429, 504} or response.status_code >= 500:
                    time.sleep(min(3, 2 ** attempt))
                    continue
                response.raise_for_status()
                return response.json()
            except requests.RequestException as exc:
                last_exc = exc
                continue
        if last_exc is not None and attempt < 3:
            time.sleep(2 ** attempt)
            continue
        break

    if last_exc is not None:
        raise RuntimeError(f"Overpass request failed after retries: {last_exc}")
    raise RuntimeError("Overpass request failed with no response")


def parse_overpass_response(payload: Dict[str, Any]) -> List[OSMPlace]:
    elements = payload.get("elements") or []
    places: List[OSMPlace] = []
    for element in elements:
        element_type = element.get("type")
        if element_type not in {"node", "way", "relation"}:
            continue
        try:
            place = OSMPlace.from_element(element)
        except (TypeError, ValueError):
            continue
        if place.lat == 0.0 and place.lng == 0.0 and not element.get("center"):
            continue
        places.append(place)
    return places


def fetch_osm_places(
    bbox: Optional[Tuple[float, float, float, float]] = None,
    around: Optional[Tuple[float, float, int]] = None,
    endpoint: Optional[str] = None,
    api_key: Optional[str] = None,
    timeout: int = 25,
) -> List[OSMPlace]:
    if bbox is None and around is None:
        raise ValueError("Either bbox or around must be provided")

    query = build_overpass_query(bbox=bbox, around=around)
    payload = fetch_overpass_json(query, endpoint=endpoint, api_key=api_key, timeout=timeout)
    return parse_overpass_response(payload)


def normalize_place_collection(raw: Iterable[Dict[str, Any]]) -> List[OSMPlace]:
    places: List[OSMPlace] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        try:
            places.append(OSMPlace.from_element(item))
        except (TypeError, ValueError):
            continue
    return places
