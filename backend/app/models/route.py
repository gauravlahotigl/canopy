from pydantic import BaseModel, Field

from app.models.place import Coordinates
from app.models.preferences import RoutePreferences


class RouteRequest(BaseModel):
    start: Coordinates
    destination: Coordinates
    preferences: RoutePreferences = Field(default_factory=RoutePreferences)
    max_extra_minutes: int = Field(default=5, ge=0, le=60)


class RouteOption(BaseModel):
    id: str
    label: str
    duration_minutes: int = Field(gt=0)
    distance_m: int = Field(gt=0)
    score: int = Field(ge=0, le=100)
    reasons: list[str]
    geometry: list[Coordinates]


class RouteResponse(BaseModel):
    recommended_route: RouteOption
    alternatives: list[RouteOption]
    attribution: str = "Routing data © OpenStreetMap contributors"
