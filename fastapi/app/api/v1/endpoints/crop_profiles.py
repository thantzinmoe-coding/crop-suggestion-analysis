from typing import Annotated, Any

from fastapi import APIRouter, Depends, status

from app.db.session import get_db_session
from app.schemas.crop_profile import CropProfileResponse

router = APIRouter(tags=["crop-profiles"])


@router.get(
    "/crop-profiles",
    response_model=list[CropProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="List crop profiles with their requirements",
)
async def list_crop_profiles(db: Annotated[Any, Depends(get_db_session)]):
    profiles = await db.crop_profiles.find({}, {"_id": 0}).sort("name", 1).to_list(length=None)
    return [CropProfileResponse.model_validate(profile) for profile in profiles]
