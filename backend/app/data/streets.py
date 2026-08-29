import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.models.place import Coordinates


class RoutingServiceError(RuntimeError):
    pass


def fetch_walking_routes(
    start: Coordinates, destination: Coordinates
) -> list[dict[str, object]]:
    base_url = os.getenv(
        "OSM_ROUTING_URL",
        "https://routing.openstreetmap.de/routed-foot/route/v1/driving",
    ).rstrip("/")
    coordinates = f"{start.lng},{start.lat};{destination.lng},{destination.lat}"
    query = urlencode({"alternatives": "true", "steps": "false", "geometries": "geojson", "overview": "full"})
    request = Request(
        f"{base_url}/{coordinates}?{query}", headers={"User-Agent": _user_agent()}
    )
    try:
        with urlopen(request, timeout=10) as response:
            payload = json.load(response)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RoutingServiceError("Walking route service is unavailable") from exc

    if payload.get("code") != "Ok" or not payload.get("routes"):
        raise RoutingServiceError(str(payload.get("message", "No walking route was found")))
    return payload["routes"]


def _user_agent() -> str:
    return os.getenv(
        "OSM_USER_AGENT",
        "CANOPY-hackathon/0.1 (https://github.com/gauravlahotigl/canopy)",
    )
