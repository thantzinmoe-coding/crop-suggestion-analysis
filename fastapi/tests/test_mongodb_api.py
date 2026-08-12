import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import get_database
from app.main import app


class FakeCursor:
    def __init__(self, documents: list[dict]):
        self.documents = documents

    def sort(self, field: str, direction: int):
        reverse = direction < 0
        self.documents.sort(key=lambda item: item[field], reverse=reverse)
        return self

    async def to_list(self, length=None):
        return self.documents[:length] if length is not None else self.documents


class FakeCollection:
    def __init__(self, documents: list[dict]):
        self.documents = documents

    def find(self, _query: dict, projection: dict):
        return FakeCursor(
            [
                {key: value for key, value in document.items() if key != "_id"}
                for document in self.documents
            ]
        )

    async def find_one(self, query: dict, projection: dict):
        return next(
            (
                {key: value for key, value in document.items() if key != "_id"}
                for document in self.documents
                if all(document.get(key) == value for key, value in query.items())
            ),
            None,
        )


class FakeDatabase:
    def __init__(self):
        requirements = [
            {
                "id": 1,
                "factor": "temperature",
                "min_value": 18,
                "max_value": 35,
                "unit": "°C",
                "criticality": "critical",
            }
        ]
        self.crop_profiles = FakeCollection(
            [
                {
                    "_id": "mongo-id",
                    "id": 1,
                    "name": "Maize",
                    "description": "Test crop",
                    "source": "Test source",
                    "requirements": requirements,
                }
            ]
        )
        self.regions = FakeCollection(
            [{"_id": "MMR001", "pcode": "MMR001", "name_en": "Sagaing", "name_my": "Sagaing"}]
        )


@pytest.mark.asyncio
async def test_mongodb_backed_endpoints_keep_api_contracts() -> None:
    app.dependency_overrides[get_database] = lambda: FakeDatabase()
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            profiles = await client.get("/api/v1/crop-profiles")
            regions = await client.get("/api/v1/regions")
            suitability = await client.post(
                "/api/v1/crop-suitability",
                json={"crop_profile_id": 1, "field_values": {"temperature": 28}},
            )
    finally:
        app.dependency_overrides.clear()

    assert profiles.status_code == 200
    assert profiles.json()[0]["name"] == "Maize"
    assert regions.status_code == 200
    assert regions.json()[0]["pcode"] == "MMR001"
    assert suitability.status_code == 200
    assert suitability.json()["score"] == 100.0
