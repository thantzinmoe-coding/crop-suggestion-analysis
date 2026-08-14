from datetime import datetime, timezone
from typing import Literal

from app.schemas.base import APIModel


class CommunityComment(APIModel):
    user_id: str
    user_name: str
    content: str
    created_at: str


class CommunityReaction(APIModel):
    like: int = 0
    love: int = 0
    helpful: int = 0
    share: int = 0


class CommunityPostCreate(APIModel):
    user_id: str
    user_name: str
    content: str
    post_type: Literal["community", "analysis", "repost"] = "community"
    crop: str | None = None
    region: str | None = None
    image_url: str | None = None
    source_analysis_id: str | None = None


class CommunityCommentCreate(APIModel):
    user_id: str
    user_name: str
    content: str


class CommunityPost(APIModel):
    id: str
    user_id: str
    user_name: str
    content: str
    post_type: str
    crop: str | None = None
    region: str | None = None
    image_url: str | None = None
    source_analysis_id: str | None = None
    reactions: CommunityReaction
    comments: list[CommunityComment] = []
    created_at: str

    @classmethod
    def from_document(cls, document: dict) -> "CommunityPost":
        return cls(
            id=str(document.get("_id")),
            user_id=document.get("user_id", ""),
            user_name=document.get("user_name", ""),
            content=document.get("content", ""),
            post_type=document.get("post_type", "community"),
            crop=document.get("crop"),
            region=document.get("region"),
            image_url=document.get("image_url"),
            source_analysis_id=document.get("source_analysis_id"),
            reactions=CommunityReaction(**document.get("reactions", {"like": 0, "love": 0, "helpful": 0, "share": 0})),
            comments=[
                CommunityComment(
                    user_id=item.get("user_id", ""),
                    user_name=item.get("user_name", ""),
                    content=item.get("content", ""),
                    created_at=item.get("created_at", datetime.now(timezone.utc).isoformat()),
                )
                for item in document.get("comments", [])
            ],
            created_at=document.get("created_at", datetime.now(timezone.utc).isoformat()),
        )
