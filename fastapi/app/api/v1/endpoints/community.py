from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.db.session import get_database
from app.schemas.community import CommunityCommentCreate, CommunityPost, CommunityPostCreate

router = APIRouter(prefix="/community", tags=["community"])


def get_community_db() -> Any:
    return get_database()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/posts", response_model=list[CommunityPost], status_code=status.HTTP_200_OK)
async def list_posts(
    crop: str | None = Query(default=None),
    region: str | None = Query(default=None),
    db: Any = Depends(get_community_db),
) -> list[CommunityPost]:
    posts = []
    filters = {}
    if crop:
        filters["crop"] = {"$regex": crop, "$options": "i"}
    if region:
        filters["region"] = {"$regex": region, "$options": "i"}
    cursor = db.posts.find(filters)
    if hasattr(cursor, "__aiter__"):
        async for document in cursor:
            posts.append(CommunityPost.from_document(document))
    else:
        for document in cursor:
            posts.append(CommunityPost.from_document(document))
    posts.sort(key=lambda item: item.created_at, reverse=True)
    return posts


@router.post("/posts", response_model=CommunityPost, status_code=status.HTTP_201_CREATED)
async def create_post(payload: CommunityPostCreate, db: Any = Depends(get_community_db)) -> CommunityPost:
    document = {
        "user_id": payload.user_id,
        "user_name": payload.user_name,
        "content": payload.content,
        "post_type": payload.post_type,
        "crop": payload.crop,
        "region": payload.region,
        "image_url": payload.image_url,
        "source_analysis_id": payload.source_analysis_id,
        "reactions": {"like": 0, "love": 0, "helpful": 0, "share": 0},
        "comments": [],
        "created_at": _now_iso(),
    }
    result = await db.posts.insert_one(document)
    document["_id"] = result.inserted_id
    return CommunityPost.from_document(document)


@router.post("/posts/{post_id}/comments", response_model=CommunityPost, status_code=status.HTTP_201_CREATED)
async def add_comment(post_id: str, payload: CommunityCommentCreate, db: Any = Depends(get_community_db)) -> CommunityPost:
    document = await db.posts.find_one({"_id": post_id})
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

    comment = {
        "user_id": payload.user_id,
        "user_name": payload.user_name,
        "content": payload.content,
        "created_at": _now_iso(),
    }
    document.setdefault("comments", []).append(comment)
    await db.posts.update_one({"_id": post_id}, {"$set": {"comments": document["comments"]}})
    return CommunityPost.from_document(document)


@router.post("/posts/{post_id}/react", response_model=CommunityPost, status_code=status.HTTP_200_OK)
async def react_to_post(post_id: str, reaction: str, db: Any = Depends(get_community_db)) -> CommunityPost:
    valid_reactions = {"like", "love", "helpful", "share"}
    if reaction not in valid_reactions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported reaction type.")

    document = await db.posts.find_one({"_id": post_id})
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

    reactions = document.setdefault("reactions", {"like": 0, "love": 0, "helpful": 0, "share": 0})
    reactions[reaction] = int(reactions.get(reaction, 0)) + 1
    await db.posts.update_one({"_id": post_id}, {"$set": {"reactions": reactions}})
    document["reactions"] = reactions
    return CommunityPost.from_document(document)
