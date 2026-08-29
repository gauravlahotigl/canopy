from __future__ import annotations

from typing import Any, Dict, List, Optional

from backend.app.routing.graph import WalkingGraph
from backend.app.routing.scoring import score_route


def generate_candidate_routes(
    graph: WalkingGraph,
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
    preferences: Optional[Dict[str, float]] = None,
    requirements: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    strategies = [
        ("Fastest", "time"),
        ("Most accessible", "accessible"),
        ("Most comfortable", "comfort"),
        ("Most shaded", "shade"),
        ("Night safe", "night"),
    ]

    candidates: List[Dict[str, Any]] = []
    for label, strategy in strategies:
        try:
            node_path = graph.path_between_points(start_lat, start_lng, end_lat, end_lng, strategy=strategy)
            metrics = graph.path_metrics(node_path)
            metrics["toilet_gap_minutes"] = 6.0
            score, reasons = score_route(metrics, preferences or {}, requirements or {})
            candidates.append(
                {
                    "id": f"route_{len(candidates) + 1}",
                    "label": label,
                    "duration_minutes": float(metrics["duration_minutes"]),
                    "distance_m": float(metrics["distance_m"]),
                    "score": score,
                    "reasons": reasons,
                    "geometry": graph.route_geometry(node_path),
                    "shade_score": float(metrics.get("shade_score", 0.5)),
                    "lighting_score": float(metrics.get("lighting_score", 0.5)),
                    "accessible": bool(metrics.get("accessible", True)),
                }
            )
        except ValueError:
            continue

    if not candidates:
        raise ValueError("No viable route candidates could be generated")

    return sorted(candidates, key=lambda candidate: candidate["score"], reverse=True)
