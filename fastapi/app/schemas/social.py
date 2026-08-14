from typing import Any

from app.schemas.base import APIModel


class FarmProfileUpdate(APIModel):
    display_name: str | None = None
    region: str | None = None
    farm_size_acres: float | None = None
    crops: list[str] = []
    bio: str | None = None


class FarmProfile(APIModel):
    user_id: str
    email: str | None = None
    display_name: str = "Farmer"
    region: str | None = None
    farm_size_acres: float | None = None
    crops: list[str] = []
    bio: str | None = None
    updated_at: str

    @classmethod
    def from_document(cls, document: dict[str, Any]) -> "FarmProfile":
        return cls(user_id=document.get("user_id", ""), email=document.get("email"), display_name=document.get("display_name", "Farmer"), region=document.get("region"), farm_size_acres=document.get("farm_size_acres"), crops=document.get("crops", []), bio=document.get("bio"), updated_at=document.get("updated_at", ""))


class SavedAnalysisCreate(APIModel):
    title: str
    analysis_type: str
    summary: str
    crop: str | None = None
    region: str | None = None
    metadata: dict[str, Any] = {}


class SavedAnalysis(APIModel):
    id: str
    user_id: str
    title: str
    analysis_type: str
    summary: str
    crop: str | None = None
    region: str | None = None
    metadata: dict[str, Any] = {}
    created_at: str

    @classmethod
    def from_document(cls, document: dict[str, Any]) -> "SavedAnalysis":
        return cls(id=str(document.get("_id")), user_id=document.get("user_id", ""), title=document.get("title", ""), analysis_type=document.get("analysis_type", ""), summary=document.get("summary", ""), crop=document.get("crop"), region=document.get("region"), metadata=document.get("metadata", {}), created_at=document.get("created_at", ""))


class Notification(APIModel):
    id: str
    user_id: str
    message: str
    kind: str
    read: bool = False
    created_at: str

    @classmethod
    def from_document(cls, document: dict[str, Any]) -> "Notification":
        return cls(id=str(document.get("_id")), user_id=document.get("user_id", ""), message=document.get("message", ""), kind=document.get("kind", ""), read=document.get("read", False), created_at=document.get("created_at", ""))
