from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.v1.dependencies import get_current_user
from app.db.session import get_database
from app.schemas.account import (
    FarmProfileUpdate,
    FavoriteCropCreate,
    MonitoringPreferencesUpdate,
    RecommendationHistoryCreate,
)

router = APIRouter(prefix="/account", tags=["account"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _clean(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if not document:
        return None
    document = dict(document)
    document.pop("_id", None)
    return document


@router.get("/profile")
async def get_profile(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Any = Depends(get_database),
) -> dict[str, Any]:
    profile = await db.farm_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return profile or {"user_id": user["id"], "email": user["email"]}


@router.put("/profile")
async def update_profile(
    payload: FarmProfileUpdate,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Any = Depends(get_database),
) -> dict[str, Any]:
    values = payload.model_dump(exclude_unset=True, by_alias=True)
    values.update({"user_id": user["id"], "email": user["email"], "updated_at": _now()})
    await db.farm_profiles.update_one({"user_id": user["id"]}, {"$set": values}, upsert=True)
    return _clean(await db.farm_profiles.find_one({"user_id": user["id"]}, {"_id": 0})) or values


@router.get("/history")
async def get_history(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Any = Depends(get_database),
) -> list[dict[str, Any]]:
    return await db.recommendation_history.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(length=50)


@router.post("/history", status_code=status.HTTP_201_CREATED)
async def save_history(
    payload: RecommendationHistoryCreate,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Any = Depends(get_database),
) -> dict[str, Any]:
    document = payload.model_dump(by_alias=True)
    document.update({"user_id": user["id"], "created_at": _now()})
    result = await db.recommendation_history.insert_one(document)
    document["id"] = str(result.inserted_id)
    document.pop("_id", None)
    return document


@router.get("/favorites")
async def get_favorites(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Any = Depends(get_database),
) -> list[dict[str, Any]]:
    return await db.favorite_crops.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(length=100)


@router.post("/favorites", status_code=status.HTTP_201_CREATED)
async def add_favorite(
    payload: FavoriteCropCreate,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Any = Depends(get_database),
) -> dict[str, Any]:
    document = {**payload.model_dump(by_alias=True), "user_id": user["id"], "created_at": _now()}
    await db.favorite_crops.update_one(
        {"user_id": user["id"], "crop_key": payload.crop_key},
        {"$setOnInsert": document},
        upsert=True,
    )
    return _clean(await db.favorite_crops.find_one({"user_id": user["id"], "crop_key": payload.crop_key}, {"_id": 0})) or document


@router.delete("/favorites/{crop_key}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    crop_key: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Any = Depends(get_database),
) -> None:
    await db.favorite_crops.delete_one({"user_id": user["id"], "crop_key": crop_key})


@router.get("/preferences")
async def get_preferences(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Any = Depends(get_database),
) -> dict[str, Any]:
    return await db.monitoring_preferences.find_one(
        {"user_id": user["id"]}, {"_id": 0}
    ) or {"user_id": user["id"], "enabled": False, "frequency": "weekly", "notify_ndvi": True, "notify_market": False}


@router.put("/preferences")
async def update_preferences(
    payload: MonitoringPreferencesUpdate,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Any = Depends(get_database),
) -> dict[str, Any]:
    values = payload.model_dump(by_alias=True)
    values.update({"user_id": user["id"], "updated_at": _now()})
    await db.monitoring_preferences.update_one({"user_id": user["id"]}, {"$set": values}, upsert=True)
    return _clean(await db.monitoring_preferences.find_one({"user_id": user["id"]}, {"_id": 0})) or values
