from dataclasses import dataclass


@dataclass(frozen=True)
class CropRequirement:
    """Embedded crop requirement document stored inside a crop profile."""

    id: int
    factor: str
    min_value: float
    max_value: float
    unit: str
    criticality: str
