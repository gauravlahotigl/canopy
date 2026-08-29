from fastapi import APIRouter

from app.models.preferences import RoutePreferences


router = APIRouter(prefix="/api/profiles", tags=["profiles"])

# Temporary in-memory storage for the hackathon MVP.
_profiles: dict[str, RoutePreferences] = {}


@router.get("/{profile_id}", response_model=RoutePreferences)
def get_profile(profile_id: str) -> RoutePreferences:
    return _profiles.get(profile_id, RoutePreferences())


@router.put("/{profile_id}", response_model=RoutePreferences)
def update_profile(profile_id: str, preferences: RoutePreferences) -> RoutePreferences:
    _profiles[profile_id] = preferences
    return preferences
