from typing import Literal

from pydantic import BaseModel, Field


class CropExplanationRequest(BaseModel):
    soil_pH: float = Field(ge=0, le=14)
    rainfall_mm: float = Field(ge=0, le=10_000)
    temperature_c: float = Field(ge=-50, le=70)
    crop: str
    language: Literal["en", "my"] = "en"
