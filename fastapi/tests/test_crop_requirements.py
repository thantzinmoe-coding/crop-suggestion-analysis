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
