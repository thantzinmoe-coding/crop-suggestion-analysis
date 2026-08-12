from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.base import APIModel

PostType = Literal["field_condition", "production_loss", "success_story"]
MediaType = Literal["image", "video"]


class CommunityMedia(APIModel):
    media_type: MediaType
    url: str = Field(pattern=r"^/uploads/community/[a-zA-Z0-9._-]+$")
    original_name: str = Field(min_length=1, max_length=255)


class CommunityPostCreate(APIModel):
    author_name: str = Field(min_length=1, max_length=80)
    post_type: PostType
    title: str = Field(min_length=3, max_length=160)
    body: str = Field(min_length=10, max_length=5000)
    crop: str = Field(min_length=1, max_length=100)
    region: str = Field(min_length=1, max_length=120)
    production_summary: str | None = Field(default=None, max_length=300)
    media: list[CommunityMedia] = Field(default_factory=list, max_length=6)


class CommunityCommentCreate(APIModel):
    author_name: str = Field(min_length=1, max_length=80)
    body: str = Field(min_length=1, max_length=1500)


class CommunityCommentResponse(APIModel):
    id: str
    author_name: str
    body: str
    created_at: datetime


class CommunityPostResponse(APIModel):
    id: str
    author_name: str
    post_type: PostType
    title: str
    body: str
    crop: str
    region: str
    production_summary: str | None = None
    media: list[CommunityMedia] = Field(default_factory=list)
    comments: list[CommunityCommentResponse]
    created_at: datetime
    updated_at: datetime
