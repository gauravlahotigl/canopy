import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.places import router as places_router
from app.api.profiles import router as profiles_router
from app.api.routes import router as routes_router

app = FastAPI(
    title="CANOPY API",
    description=(
        "Comfort-aware walking routes using OpenStreetMap data. "
        "© OpenStreetMap contributors."
    ),
    version="0.1.0",
)

frontend_origins = os.getenv(
    "FRONTEND_ORIGINS", "http://localhost:3000,http://localhost:5173"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_router)
app.include_router(places_router)
app.include_router(profiles_router)


@app.get("/health")
def health():
    return {"status": "ok"}
