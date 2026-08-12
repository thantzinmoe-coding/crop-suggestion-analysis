from dataclasses import dataclass, field

from app.db.models.crop_requirement import CropRequirement


@dataclass(slots=True)
class CropProfile:
    id: int
    name: str
    description: str | None = None
    source: str | None = None
    source_url: str | None = None
    requirements: list[CropRequirement] = field(default_factory=list)
