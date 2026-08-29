from math import ceil

from app.data.streets import fetch_walking_routes
from app.models.place import Coordinates
from app.models.route import RouteOption, RouteRequest, RouteResponse


def find_routes(request: RouteRequest) -> RouteResponse:
    raw_routes = fetch_walking_routes(request.start, request.destination)
    options = [_to_route_option(route, index) for index, route in enumerate(raw_routes)]
    fastest_minutes = min(route.duration_minutes for route in options)
    allowed = [
        route
        for route in options
        if route.duration_minutes <= fastest_minutes + request.max_extra_minutes
    ]
    recommended = max(allowed, key=lambda route: route.score)
    return RouteResponse(
        recommended_route=recommended,
        alternatives=[route for route in allowed if route.id != recommended.id],
    )


def _to_route_option(route: dict[str, object], index: int) -> RouteOption:
    geometry = route.get("geometry")
    if not isinstance(geometry, dict) or not isinstance(geometry.get("coordinates"), list):
        raise ValueError("Routing service returned invalid geometry")

    duration_minutes = max(1, ceil(float(route["duration"]) / 60))
    distance_m = max(1, round(float(route["distance"])))
    label = "Fastest" if index == 0 else f"Alternative {index}"
    # OSM routing ranks with its walking profile. CANOPY comfort scoring can
    # replace this score after shade and accessibility data are connected.
    score = max(50, 90 - index * 10)
    return RouteOption(
        id=f"osm_route_{index + 1}",
        label=label,
        duration_minutes=duration_minutes,
        distance_m=distance_m,
        score=score,
        reasons=["OpenStreetMap walking route", f"{distance_m} m total distance"],
        geometry=[
            Coordinates(lat=float(point[1]), lng=float(point[0]))
            for point in geometry["coordinates"]
        ],
    )
