from __future__ import annotations

from typing import Any, Dict, Optional

from backend.app.routing.candidates import generate_candidate_routes
from backend.app.routing.graph import WalkingGraph


def optimise_route(request: Optional[Dict[str, Any]] = None, graph: Optional[WalkingGraph] = None) -> Dict[str, Any]:
    payload = request or {}

    if graph is None:
        graph = payload.get("graph")
    if graph is None:
        raise ValueError("A route graph is required to optimise a route")

    start = payload.get("start", {})
    destination = payload.get("destination", {})
    if not start or not destination:
        raise ValueError("Both start and destination coordinates are required")

    start_lat = float(start["lat"])
    start_lng = float(start["lng"])
    end_lat = float(destination["lat"])
    end_lng = float(destination["lng"])

    preferences = payload.get("preferences") or {}
    requirements = payload.get("requirements") or {}
    candidates = generate_candidate_routes(
        graph,
        start_lat,
        start_lng,
        end_lat,
        end_lng,
        preferences=preferences,
        requirements=requirements,
    )

    recommended = candidates[0]
    alternatives = candidates[1:]

    return {
        "recommended_route": {
            "id": recommended["id"],
            "duration_minutes": round(recommended["duration_minutes"], 2),
            "distance_m": round(recommended["distance_m"], 0),
            "score": recommended["score"],
            "reasons": recommended["reasons"],
            "geometry": recommended["geometry"],
            "label": recommended["label"],
        },
        "alternatives": [
            {
                "id": candidate["id"],
                "label": candidate["label"],
                "duration_minutes": round(candidate["duration_minutes"], 2),
                "score": candidate["score"],
            }
            for candidate in alternatives
        ],
    }
