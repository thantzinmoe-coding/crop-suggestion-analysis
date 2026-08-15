import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_crop_requirement_search_returns_averaged_conditions() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/crop-requirements", params={"query": "Mint"})

    assert response.status_code == 200
    result = response.json()[0]
    assert result["cropKey"] == "Mint"
    assert result["averageTemperatureC"] > 0
    assert result["waterNeed"] in {"Low", "Medium", "High"}
    assert 0 <= result["averageSoilPh"] <= 14
    assert 0 <= result["averageHumidityPct"] <= 100
    assert result["lightIntensity"] == "Partial Sun"
    assert result["suitableRegions"]
    assert len(result["suitableRegions"]) <= 5
    assert all(0 <= region["suitabilityPercent"] <= 100 for region in result["suitableRegions"])


@pytest.mark.asyncio
async def test_crop_requirement_regions_use_history_and_localize_names() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        english = await client.get(
            "/api/v1/crop-requirements", params={"query": "Rice", "language": "en"}
        )
        myanmar = await client.get(
            "/api/v1/crop-requirements", params={"query": "Rice", "language": "my"}
        )

    assert english.status_code == 200
    assert myanmar.status_code == 200
    english_regions = english.json()[0]["suitableRegions"]
    myanmar_regions = myanmar.json()[0]["suitableRegions"]
    assert any(region["historicalCropRecords"] > 0 for region in english_regions)
    assert [region["regionKey"] for region in myanmar_regions] == [
        region["regionKey"] for region in english_regions
    ]
    assert any(region["region"] != region["regionKey"] for region in myanmar_regions)
