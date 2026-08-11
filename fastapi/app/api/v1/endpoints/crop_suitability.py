from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.db.models.crop_profile import CropProfile
from app.db.models.crop_requirement import CropRequirement
from app.db.session import get_db_session
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
    db: Annotated[Any, Depends(get_db_session)],
):
    profile_document = await db.crop_profiles.find_one(
        {"id": request.crop_profile_id}, {"_id": 0}
    )
    if not profile_document:
        raise HTTPException(status_code=404, detail="Crop profile not found")

    crop_profile = CropProfile(
        id=profile_document["id"],
        name=profile_document["name"],
        description=profile_document.get("description"),
        source=profile_document.get("source"),
        source_url=profile_document.get("source_url"),
        requirements=[
            CropRequirement(**requirement)
            for requirement in profile_document.get("requirements", [])
        ],
    )

    return score_suitability(crop_profile, crop_profile.requirements, request.field_values)
