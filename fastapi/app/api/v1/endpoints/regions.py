from typing import Annotated, Any

from fastapi import APIRouter, Depends, status

from app.db.session import get_db_session
from app.schemas.region import RegionResponse

router = APIRouter(tags=["regions"])


@router.get(
    "/regions",
    response_model=list[RegionResponse],
    status_code=status.HTTP_200_OK,
    summary="List all Myanmar regions",
)
async def list_regions(db: Annotated[Any, Depends(get_db_session)]):
    regions = await db.regions.find({}, {"_id": 0}).sort("name_en", 1).to_list(length=None)
    return [RegionResponse.model_validate(region) for region in regions]
