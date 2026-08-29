from fastapi import APIRouter, HTTPException

from app.data.streets import RoutingServiceError
from app.models.route import RouteRequest, RouteResponse
from app.services.canopy import find_routes


router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.post("", response_model=RouteResponse)
def create_route(request: RouteRequest) -> RouteResponse:
    try:
        return find_routes(request)
    except RoutingServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=502, detail="Routing service returned an invalid response"
        ) from exc
