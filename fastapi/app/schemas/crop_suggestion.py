from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.base import APIModel


class CropSuggestionRequest(BaseModel):
    soil_ph: float = Field(alias="soil_pH", ge=0, le=14)
    rainfall_mm: float = Field(ge=0, le=10_000)
    temperature_c: float = Field(ge=-50, le=70)
    humidity_pct: float | None = Field(default=None, ge=0, le=100)
    field_area_acres: float = Field(default=1, gt=0, le=100_000)
    admin1: str | None = None
    admin2: str | None = None
    language: Literal["en", "my"] = "en"


class CropSuggestionResponse(APIModel):
    crop: str
    confidence_percent: float = Field(ge=0, le=100)
    recommendations: list["CropRecommendation"]


class CropRecommendation(APIModel):
    crop: str
    crop_key: str
    suitability_percent: float = Field(ge=0, le=100)
    market_price_mmk_per_kg: float = Field(ge=0)
    description: str
    market_price_source: str | None = None
    market_price_observed_date: str | None = None
    market_name: str | None = None
    market_price_is_dynamic: bool = False
    water_need_liters_per_day: float | None = None
    sunlight: str | None = None
    growth_period_years: str | None = None


class PlantSuggestionRequest(CropSuggestionRequest):
    field_area_acres: float = Field(default=1, gt=0, le=100_000)


class PlantRecommendation(APIModel):
    name: str
    match_score: float = Field(ge=0, le=100)
    estimated_capacity: int = Field(ge=0)
    description: str
    market_price_mmk_per_kg: str


class PlantSuggestionResponse(APIModel):
    recommendations: list[PlantRecommendation]


class SuitableRegion(APIModel):
    region: str
    region_key: str
    suitability_percent: float = Field(ge=0, le=100)
    data_records: int = Field(ge=0)
    historical_crop_records: int = Field(ge=0)


class CropRequirement(APIModel):
    crop: str
    crop_key: str
    average_temperature_c: float
    water_need: str
    average_soil_ph: float
    average_humidity_pct: float
    light_intensity: str
    suitable_regions: list[SuitableRegion]
