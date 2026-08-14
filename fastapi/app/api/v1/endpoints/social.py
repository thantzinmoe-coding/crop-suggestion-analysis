from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.endpoints.auth import require_user
from app.db.session import get_database
from app.schemas.social import FarmProfile, FarmProfileUpdate, Notification, SavedAnalysis, SavedAnalysisCreate

router = APIRouter(prefix="/social", tags=["social analysis"])


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def oid(value: str) -> ObjectId | str:
    return ObjectId(value) if ObjectId.is_valid(value) else value


@router.get("/profile", response_model=FarmProfile)
async def get_profile(user: dict[str, Any] = Depends(require_user), db: Any = Depends(get_database)) -> FarmProfile:
    user_id = str(user["_id"])
    document = await db.farm_profiles.find_one({"user_id": user_id}) or {"user_id": user_id, "email": user.get("email"), "updated_at": now()}
    return FarmProfile.from_document(document)


@router.put("/profile", response_model=FarmProfile)
async def update_profile(payload: FarmProfileUpdate, user: dict[str, Any] = Depends(require_user), db: Any = Depends(get_database)) -> FarmProfile:
    user_id = str(user["_id"])
    values = payload.model_dump(exclude_none=True)
    values.update({"user_id": user_id, "email": user.get("email"), "updated_at": now()})
    await db.farm_profiles.update_one({"user_id": user_id}, {"$set": values}, upsert=True)
    return FarmProfile.from_document(await db.farm_profiles.find_one({"user_id": user_id}))


@router.post("/saved-analyses", response_model=SavedAnalysis, status_code=201)
async def save_analysis(payload: SavedAnalysisCreate, user: dict[str, Any] = Depends(require_user), db: Any = Depends(get_database)) -> SavedAnalysis:
    document = {**payload.model_dump(), "user_id": str(user["_id"]), "created_at": now()}
    result = await db.saved_analyses.insert_one(document)
    document["_id"] = result.inserted_id
    return SavedAnalysis.from_document(document)


@router.get("/saved-analyses", response_model=list[SavedAnalysis])
async def list_saved_analyses(user: dict[str, Any] = Depends(require_user), db: Any = Depends(get_database)) -> list[SavedAnalysis]:
    documents = await db.saved_analyses.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(length=100)
    return [SavedAnalysis.from_document(document) for document in documents]


@router.get("/notifications", response_model=list[Notification])
async def list_notifications(user: dict[str, Any] = Depends(require_user), db: Any = Depends(get_database)) -> list[Notification]:
    documents = await db.notifications.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(length=100)
    return [Notification.from_document(document) for document in documents]


@router.post("/notifications/read")
async def mark_notifications_read(user: dict[str, Any] = Depends(require_user), db: Any = Depends(get_database)) -> dict[str, int]:
    result = await db.notifications.update_many({"user_id": str(user["_id"]), "read": False}, {"$set": {"read": True}})
    return {"updated": result.modified_count}
