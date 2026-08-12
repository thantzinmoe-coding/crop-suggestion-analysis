from copy import deepcopy
from types import SimpleNamespace

import pytest
from bson import ObjectId
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import community as community_endpoint
from app.db.session import get_database
from app.main import app


class CommunityCursor:
    def __init__(self, documents: list[dict]):
        self.documents = documents

    def sort(self, field: str, direction: int):
        self.documents.sort(key=lambda document: document[field], reverse=direction < 0)
        return self

    def limit(self, length: int):
        self.documents = self.documents[:length]
        return self

    async def to_list(self, length: int):
        return deepcopy(self.documents[:length])


class CommunityCollection:
    def __init__(self):
        self.documents: list[dict] = []

    async def insert_one(self, document: dict):
        inserted_id = ObjectId()
        stored = deepcopy(document)
        stored["_id"] = inserted_id
        self.documents.append(stored)
        return SimpleNamespace(inserted_id=inserted_id)

    def find(self, query: dict):
        documents = [
            document
            for document in self.documents
            if all(document.get(key) == value for key, value in query.items())
        ]
        return CommunityCursor(deepcopy(documents))

    async def find_one_and_update(self, query: dict, update: dict, **_options):
        for document in self.documents:
            if document["_id"] == query["_id"]:
                document["comments"].append(deepcopy(update["$push"]["comments"]))
                document.update(update["$set"])
                return deepcopy(document)
        return None


class CommunityDatabase:
    def __init__(self):
        self.community_posts = CommunityCollection()


@pytest.mark.asyncio
async def test_farmer_can_publish_and_comment_on_a_community_post() -> None:
    database = CommunityDatabase()
    app.dependency_overrides[get_database] = lambda: database
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            created = await client.post(
                "/api/v1/community/posts",
                json={
                    "authorName": "Aye Aye",
                    "postType": "production_loss",
                    "title": "Rice yield dropped this season",
                    "body": "The leaves turned yellow after heavy rain. What should I check?",
                    "crop": "Rice",
                    "region": "Bago Region",
                    "productionSummary": "About 30% lower than last season",
                    "media": [
                        {
                            "mediaType": "image",
                            "url": "/uploads/community/rice-field.jpg",
                            "originalName": "rice-field.jpg",
                        }
                    ],
                },
            )
            post_id = created.json()["id"]
            commented = await client.post(
                f"/api/v1/community/posts/{post_id}/comments",
                json={
                    "authorName": "Ko Min",
                    "body": "Check drainage first and test the soil nitrogen level.",
                },
            )
            listed = await client.get("/api/v1/community/posts")
    finally:
        app.dependency_overrides.clear()

    assert created.status_code == 201
    assert created.json()["postType"] == "production_loss"
    assert created.json()["media"][0]["mediaType"] == "image"
    assert commented.status_code == 201
    assert commented.json()["comments"][0]["authorName"] == "Ko Min"
    assert listed.status_code == 200
    assert listed.json()[0]["comments"][0]["body"].startswith("Check drainage")


@pytest.mark.asyncio
async def test_farmer_can_upload_a_community_photo(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(community_endpoint, "COMMUNITY_MEDIA_DIR", tmp_path)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/community/media",
            files={"file": ("field.png", b"small-image-content", "image/png")},
        )

    assert response.status_code == 201
    assert response.json()["mediaType"] == "image"
    assert response.json()["url"].endswith(".png")
    assert len(list(tmp_path.glob("*.png"))) == 1
