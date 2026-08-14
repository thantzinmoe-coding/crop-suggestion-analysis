from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


class FakeCollection:
    def __init__(self, initial=None):
        self.items = list(initial or [])

    def find(self, query=None):
        return list(item.copy() for item in self.items)

    def __aiter__(self):
        self._iterator = iter(self.items)
        return self

    async def __anext__(self):
        try:
            return next(self._iterator)
        except StopIteration:
            raise StopAsyncIteration

    async def find_one(self, query=None):
        for item in self.items:
            if item.get("_id") == query.get("_id"):
                return item.copy()
        return None

    async def insert_one(self, document):
        document = document.copy()
        document["_id"] = f"post-{len(self.items) + 1}"
        self.items.append(document)
        return SimpleNamespace(inserted_id=document["_id"])

    async def update_one(self, query, update):
        for item in self.items:
            if item.get("_id") == query.get("_id"):
                item.update(update.get("$set", {}))
                return SimpleNamespace(modified_count=1)
        return SimpleNamespace(modified_count=0)


@pytest.mark.asyncio
async def test_get_community_posts() -> None:
    fake_db = SimpleNamespace(
        posts=FakeCollection([
            {
                "_id": "post-1",
                "user_id": "user-1",
                "user_name": "Farmer A",
                "content": "Rice looks healthy after the rain.",
                "post_type": "community",
                "reactions": {"like": 1, "love": 0, "helpful": 0},
                "comments": [],
                "created_at": "2026-08-13T00:00:00Z",
            }
        ])
    )

    from app.api.v1 import endpoints as endpoints_module
    original = endpoints_module.community.get_database
    endpoints_module.community.get_database = lambda: fake_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/community/posts")
    finally:
        endpoints_module.community.get_database = original

    assert response.status_code == 200
    assert response.json()[0]["userName"] == "Farmer A"
    assert response.json()[0]["content"] == "Rice looks healthy after the rain."


@pytest.mark.asyncio
async def test_create_community_post() -> None:
    fake_db = SimpleNamespace(posts=FakeCollection())

    from app.api.v1 import endpoints as endpoints_module
    original = endpoints_module.community.get_database
    endpoints_module.community.get_database = lambda: fake_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/community/posts",
                json={
                    "userId": "user-42",
                    "userName": "Farmer B",
                    "content": "Posting a crop update from my field.",
                    "postType": "community",
                    "crop": "Rice",
                    "region": "Yangon",
                },
            )
    finally:
        endpoints_module.community.get_database = original

    assert response.status_code == 201
    assert response.json()["content"] == "Posting a crop update from my field."
    assert response.json()["crop"] == "Rice"


@pytest.mark.asyncio
async def test_add_comment_to_post() -> None:
    fake_db = SimpleNamespace(
        posts=FakeCollection([
            {
                "_id": "post-1",
                "user_id": "user-1",
                "user_name": "Farmer A",
                "content": "Rice looks healthy after the rain.",
                "post_type": "community",
                "reactions": {"like": 1, "love": 0, "helpful": 0},
                "comments": [],
                "created_at": "2026-08-13T00:00:00Z",
            }
        ])
    )

    from app.api.v1 import endpoints as endpoints_module
    original = endpoints_module.community.get_database
    endpoints_module.community.get_database = lambda: fake_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/community/posts/post-1/comments",
                json={
                    "userId": "user-2",
                    "userName": "Farmer C",
                    "content": "Looks good. We have similar rainfall here.",
                },
            )
    finally:
        endpoints_module.community.get_database = original

    assert response.status_code == 201
    assert response.json()["comments"][0]["content"] == "Looks good. We have similar rainfall here."
