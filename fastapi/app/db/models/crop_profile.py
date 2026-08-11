from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime

from app.db.models.crop_requirement import CropRequirement


@dataclass(frozen=True)
class CropProfile:
    id: int
    name: str
    description: str | None = None
    source: str | None = None
    source_url: str | None = None
    requirements: list[CropRequirement] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
