
from app.schemas.base import APIModel


class CropRequirementResponse(APIModel):
    id: int
    factor: str
    min_value: float
    max_value: float
    unit: str
    criticality: str


class CropProfileResponse(APIModel):
    id: int
    name: str
    description: str | None
    source: str | None
    requirements: list[CropRequirementResponse]


class CropSuitabilityRequest(APIModel):
    crop_profile_id: int
    field_values: dict[str, float | None] = {}
    """Mapping of factor names (e.g. temperature, soil_moisture) to observed values."""


class FactorEvidence(APIModel):
    factor: str
    value: float | None
    range_min: float
    range_max: float
    unit: str
    impact: float
    criticality: str
    status: str


class CropSuitabilityResponse(APIModel):
    score: float
    risk_factors: list[str]
    recommendation: str
    evidence: list[FactorEvidence]
