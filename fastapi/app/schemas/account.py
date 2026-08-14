from typing import Any, Literal

from pydantic import Field

from app.schemas.base import APIModel


class FarmProfileUpdate(APIModel):
    farm_name: str | None = Field(default=None, max_length=120)
    region_pcode: str | None = Field(default=None, max_length=32)
    region_name: str | None = Field(default=None, max_length=160)
    district_name: str | None = Field(default=None, max_length=160)
    area_acres: float | None = Field(default=None, ge=0, le=100_000)
    soil_type: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=1_000)


class RecommendationHistoryCreate(APIModel):
    crop: str = Field(min_length=1, max_length=120)
    crop_key: str | None = Field(default=None, max_length=120)
    suitability_percent: float | None = Field(default=None, ge=0, le=100)
    inputs: dict[str, Any] = Field(default_factory=dict)
    location: dict[str, Any] = Field(default_factory=dict)


class FavoriteCropCreate(APIModel):
    crop_key: str = Field(min_length=1, max_length=120)
    crop_name: str = Field(min_length=1, max_length=120)


class MonitoringPreferencesUpdate(APIModel):
    region_pcode: str | None = Field(default=None, max_length=32)
    enabled: bool = True
    frequency: Literal["daily", "weekly", "monthly"] = "weekly"
    notify_ndvi: bool = True
    notify_market: bool = False
