from dataclasses import dataclass


@dataclass(slots=True)
class CropRequirement:
    id: int
    factor: str
    min_value: float
    max_value: float
    unit: str
    criticality: str
