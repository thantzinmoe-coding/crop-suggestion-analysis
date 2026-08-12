import re
from datetime import UTC, datetime
from typing import Annotated, Any
from uuid import uuid4

import anyio
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pymongo import DESCENDING, ReturnDocument

from app.core.media import COMMUNITY_MEDIA_DIR
from app.db.session import get_database
from app.schemas.community import (
    CommunityCommentCreate,
    CommunityMedia,
    CommunityPostCreate,
    CommunityPostResponse,
    PostType,
)

router = APIRouter(prefix="/community", tags=["community"])

MEDIA_TYPES = {
    "image/jpeg": ("image", ".jpg", 10 * 1024 * 1024),
    "image/png": ("image", ".png", 10 * 1024 * 1024),
    "image/webp": ("image", ".webp", 10 * 1024 * 1024),
    "image/gif": ("image", ".gif", 10 * 1024 * 1024),
    "video/mp4": ("video", ".mp4", 50 * 1024 * 1024),
    "video/webm": ("video", ".webm", 50 * 1024 * 1024),
    "video/quicktime": ("video", ".mov", 50 * 1024 * 1024),
}


def _serialize_post(document: dict[str, Any]) -> CommunityPostResponse:
    post = {**document, "id": str(document["_id"])}
    post["comments"] = [
        {**comment, "id": str(comment["_id"])}
        for comment in document.get("comments", [])
    ]
    return CommunityPostResponse.model_validate(post)


@router.post(
    "/media",
    response_model=CommunityMedia,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a photo or video for a community post",
)
async def upload_community_media(file: Annotated[UploadFile, File()]):
    media_config = MEDIA_TYPES.get(file.content_type or "")
    if not media_config:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Supported files are JPG, PNG, WebP, GIF, MP4, WebM, and MOV.",
        )

    media_type, extension, max_size = media_config
    stored_name = f"{uuid4().hex}{extension}"
    destination = COMMUNITY_MEDIA_DIR / stored_name
    total_size = 0

    try:
        async with await anyio.open_file(destination, "wb") as output:
            while chunk := await file.read(1024 * 1024):
                total_size += len(chunk)
                if total_size > max_size:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail=(
                            "Images must be 10 MB or smaller."
                            if media_type == "image"
                            else "Videos must be 50 MB or smaller."
                        ),
                    )
                await output.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await file.close()

    if total_size == 0:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    original_name = (file.filename or f"community{extension}")[:255]
    return CommunityMedia(
        media_type=media_type,
        url=f"/uploads/community/{stored_name}",
        original_name=original_name,
    )


@router.get(
    "/posts",
    response_model=list[CommunityPostResponse],
    summary="List farmer community posts",
)
async def list_community_posts(
    database: Annotated[Any, Depends(get_database)],
    post_type: PostType | None = None,
    crop: str | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
):
    query: dict[str, Any] = {}
    if post_type:
        query["post_type"] = post_type
    if crop:
        query["crop"] = {"$regex": f"^{re.escape(crop)}$", "$options": "i"}

    cursor = database.community_posts.find(query).sort("created_at", DESCENDING).limit(limit)
    documents = await cursor.to_list(length=limit)
    return [_serialize_post(document) for document in documents]


@router.post(
    "/posts",
    response_model=CommunityPostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Share a field update with other farmers",
)
async def create_community_post(
    request: CommunityPostCreate,
    database: Annotated[Any, Depends(get_database)],
):
    now = datetime.now(UTC)
    document = {
        **request.model_dump(),
        "comments": [],
        "created_at": now,
        "updated_at": now,
    }
    result = await database.community_posts.insert_one(document)
    document["_id"] = result.inserted_id
    return _serialize_post(document)


@router.post(
    "/posts/{post_id}/comments",
    response_model=CommunityPostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Comment on a farmer community post",
)
async def add_community_comment(
    post_id: str,
    request: CommunityCommentCreate,
    database: Annotated[Any, Depends(get_database)],
):
    try:
        object_id = ObjectId(post_id)
    except InvalidId as exc:
        raise HTTPException(status_code=404, detail="Community post not found") from exc

    now = datetime.now(UTC)
    comment = {
        "_id": ObjectId(),
        **request.model_dump(),
        "created_at": now,
    }
    document = await database.community_posts.find_one_and_update(
        {"_id": object_id},
        {"$push": {"comments": comment}, "$set": {"updated_at": now}},
        return_document=ReturnDocument.AFTER,
    )
    if not document:
        raise HTTPException(status_code=404, detail="Community post not found")
    return _serialize_post(document)
