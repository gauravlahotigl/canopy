from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple


def clamp(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    return max(lower, min(upper, value))


def build_weight_profile(preferences: Optional[Dict[str, float]] = None) -> Dict[str, float]:
    defaults = {
        "time": 1.0,
        "heat": 0.7,
        "walking": 0.4,
        "accessibility": 0.9,
        "toilet": 0.8,
        "lighting": 0.5,
        "rest": 0.5,
        "shade": 0.7,
    }
    if preferences:
        for key, value in preferences.items():
            if key in defaults:
                defaults[key] = float(value)
    return defaults


def score_route(route_metrics: Dict[str, Any], preferences: Optional[Dict[str, float]] = None, requirements: Optional[Dict[str, Any]] = None) -> Tuple[float, List[str]]:
    weights = build_weight_profile(preferences)
    requirements = requirements or {}

    time_minutes = float(route_metrics.get("duration_minutes", 0.0))
    shade_score = clamp(float(route_metrics.get("shade_score", 0.5)))
    lighting_score = clamp(float(route_metrics.get("lighting_score", 0.5)))
    accessible = bool(route_metrics.get("accessible", True))
    stairs = bool(route_metrics.get("stairs", False))
    distance_m = float(route_metrics.get("distance_m", 0.0))
    toilet_gap_minutes = float(route_metrics.get("toilet_gap_minutes", 999.0))

    heat_penalty = (1.0 - shade_score) * 45.0 * weights.get("heat", 0.7)
    walk_penalty = (distance_m / 1000.0) * 6.0 * weights.get("walking", 0.4)
    time_penalty = time_minutes * 3.0 * weights.get("time", 1.0)

    accessibility_penalty = 0.0
    if not accessible:
        accessibility_penalty += 30.0 * weights.get("accessibility", 0.9)
    if stairs:
        accessibility_penalty += 22.0 * weights.get("accessibility", 0.9)

    lighting_penalty = (1.0 - lighting_score) * 20.0 * weights.get("lighting", 0.5)

    toilet_penalty = 0.0
    if toilet_gap_minutes > 0 and toilet_gap_minutes < 30:
        toilet_penalty = (toilet_gap_minutes / 10.0) * 8.0 * weights.get("toilet", 0.8)
    elif toilet_gap_minutes >= 30:
        toilet_penalty = 30.0 * weights.get("toilet", 0.8)

    requirement_penalty = 0.0
    if requirements.get("toilet", {}).get("importance") == "required" and toilet_gap_minutes > 0:
        requirement_penalty += 25.0
    if requirements.get("accessibility", {}).get("importance") == "required" and (not accessible or stairs):
        requirement_penalty += 35.0

    total_penalty = (
        time_penalty
        + heat_penalty
        + walk_penalty
        + accessibility_penalty
        + toilet_penalty
        + lighting_penalty
        + requirement_penalty
    )
    score = max(0.0, min(100.0, 100.0 - total_penalty))

    reasons: List[str] = []
    reasons.append(f"{shade_score * 100:.0f}% shaded")
    if lighting_score >= 0.75:
        reasons.append("Well-lit walking")
    if accessible and not stairs:
        reasons.append("Step-free")
    elif stairs:
        reasons.append("Includes stairs")
    if toilet_gap_minutes < 10:
        reasons.append("Toilet nearby")
    if distance_m < 1000:
        reasons.append("Shorter walk")
    if not reasons:
        reasons.append("Balanced route")

    return round(score, 2), reasons


def route_relevance_score(route_metrics: Dict[str, Any], preferences: Optional[Dict[str, float]] = None) -> float:
    score, _ = score_route(route_metrics, preferences)
    return score
