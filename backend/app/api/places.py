from fastapi import APIRouter, HTTPException, Query

from app.data.places import PlaceSearchError, search_places
from app.models.place import PlaceSearchResponse


router = APIRouter(prefix="/api/places", tags=["places"])


@router.get("/search", response_model=PlaceSearchResponse)
def find_places(
    query: str = Query(min_length=2, max_length=200),
    limit: int = Query(default=8, ge=1, le=10),
) -> PlaceSearchResponse:
    try:
        return PlaceSearchResponse(results=search_places(query, limit))
    except PlaceSearchError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
