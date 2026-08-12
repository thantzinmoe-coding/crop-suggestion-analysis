from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.db.models.crop_profile import CropProfile
from app.db.models.crop_requirement import CropRequirement
from app.db.session import get_database
from app.schemas.crop_profile import CropSuitabilityRequest, CropSuitabilityResponse
from app.services.suitability import score_suitability

router = APIRouter(tags=["crop-suitability"])


@router.post(
    "/crop-suitability",
    response_model=CropSuitabilityResponse,
    status_code=status.HTTP_200_OK,
    summary="Score field conditions against a crop profile",
)
async def evaluate_crop_suitability(
    request: CropSuitabilityRequest,
    database: Annotated[Any, Depends(get_database)],
):
    document = await database.crop_profiles.find_one(
        {"id": request.crop_profile_id},
        {"_id": 0},
    )
    if not document:
        raise HTTPException(status_code=404, detail="Crop profile not found")

    requirements = [
        CropRequirement(**requirement)
        for requirement in document.get("requirements", [])
    ]
    crop_profile = CropProfile(
        id=document["id"],
        name=document["name"],
        description=document.get("description"),
        source=document.get("source"),
        source_url=document.get("source_url"),
        requirements=requirements,
    )

    return score_suitability(crop_profile, requirements, request.field_values)
