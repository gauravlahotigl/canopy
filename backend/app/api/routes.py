from __future__ import annotations

from typing import Any, Dict, List, Optional

from backend.app.api.places import build_route_payload
from backend.app.data.places import OSMPlace
from backend.app.routing.optimiser import optimise_route


def plan_route_from_osm(
    start: Dict[str, float],
    destination: Dict[str, float],
    places: Optional[List[OSMPlace]] = None,
    preferences: Optional[Dict[str, float]] = None,
    requirements: Optional[Dict[str, Any]] = None,
    graph: Optional[Any] = None,
) -> Dict[str, Any]:
    request = build_route_payload(
        start=start,
        destination=destination,
        places=places,
        preferences=preferences,
        requirements=requirements,
    )
    if graph is not None:
        request["graph"] = graph
    return optimise_route(request=request, graph=graph)
