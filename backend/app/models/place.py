from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class Place(BaseModel):
    id: str
    type: str
    category: str | None = None
    name: str
    location: Coordinates


class PlaceSearchResponse(BaseModel):
    results: list[Place]
    attribution: str = "Search data © OpenStreetMap contributors"
