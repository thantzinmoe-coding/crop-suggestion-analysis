"""MongoDB database package."""

from app.db.models import (  # noqa: F401 — register models with Base.metadata
    CropProfile,
    CropRequirement,
    NDVIMeasurement,
    Region,
)
