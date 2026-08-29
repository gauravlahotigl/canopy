from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Preference(BaseModel):
    importance: Literal["ignored", "preferred", "required"] = "preferred"
    weight: float = Field(default=0.5, ge=0, le=1)
    max_gap_minutes: int | None = Field(default=None, gt=0, le=120)

    @model_validator(mode="after")
    def required_facility_has_maximum_gap(self) -> "Preference":
        if self.importance == "required" and self.max_gap_minutes is None:
            raise ValueError("A required preference must include max_gap_minutes")
        return self


class RoutePreferences(BaseModel):
    shade: Preference = Field(default_factory=lambda: Preference(weight=0.5))
    toilet: Preference = Field(default_factory=lambda: Preference(weight=0.5))
    accessibility: Preference = Field(default_factory=lambda: Preference(weight=0.5))
    rest: Preference = Field(default_factory=lambda: Preference(weight=0.5))
    lighting: Preference = Field(default_factory=lambda: Preference(weight=0.5))

    @model_validator(mode="before")
    @classmethod
    def accept_simple_weights(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data
        return {
            key: {"importance": "preferred", "weight": value}
            if isinstance(value, (int, float)) and not isinstance(value, bool)
            else value
            for key, value in data.items()
        }
