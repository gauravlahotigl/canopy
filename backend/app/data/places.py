import json
import os
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.models.place import Coordinates, Place


class PlaceSearchError(RuntimeError):
    pass


_CACHE_SECONDS = 300
_cache: dict[tuple[str, int], tuple[float, list[Place]]] = {}
_request_lock = threading.Lock()
_last_request_at = 0.0


def search_places(query: str, limit: int = 8) -> list[Place]:
    cache_key = (query.casefold().strip(), limit)
    cached = _cache.get(cache_key)
    if cached and time.monotonic() - cached[0] < _CACHE_SECONDS:
        return cached[1]

    base_url = os.getenv("OSM_NOMINATIM_URL", "https://nominatim.openstreetmap.org").rstrip("/")
    params = urlencode({"q": query, "format": "jsonv2", "addressdetails": 1, "countrycodes": "au", "limit": limit})
    request = Request(
        f"{base_url}/search?{params}",
        headers={"User-Agent": _user_agent(), "Accept-Language": "en-AU,en"},
    )
    global _last_request_at
    try:
        with _request_lock:
            wait_seconds = 1.0 - (time.monotonic() - _last_request_at)
            if wait_seconds > 0:
                time.sleep(wait_seconds)
            with urlopen(request, timeout=10) as response:
                results = json.load(response)
            _last_request_at = time.monotonic()
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise PlaceSearchError("OpenStreetMap place search is unavailable") from exc

    places = [
        Place(
            id=f"{item['osm_type']}_{item['osm_id']}",
            name=item.get("display_name", "Unnamed place"),
            type=item.get("type", "place"),
            category=item.get("category"),
            location=Coordinates(lat=float(item["lat"]), lng=float(item["lon"])),
        )
        for item in results
    ]
    _cache[cache_key] = (time.monotonic(), places)
    return places


def _user_agent() -> str:
    return os.getenv(
        "OSM_USER_AGENT",
        "CANOPY-hackathon/0.1 (https://github.com/gauravlahotigl/canopy)",
    )
