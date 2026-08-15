import pytest

from app.services import weather


@pytest.mark.asyncio
async def test_regional_fallback_updates_all_location_conditions(monkeypatch) -> None:
    async def no_live_weather(lat: float, lon: float) -> None:
        return None

    monkeypatch.setattr(weather, "_fetch_openweather", no_live_weather)

    yangon = await weather.get_location_weather(16.87, 96.19, "en")
    mandalay = await weather.get_location_weather(21.98, 96.09, "en")

    assert yangon["current"]["soil_pH_estimate"] != mandalay["current"]["soil_pH_estimate"]
    assert yangon["current"]["temperature_c"] != mandalay["current"]["temperature_c"]
    assert yangon["current"]["rainfall_7d_mm"] != mandalay["current"]["rainfall_7d_mm"]
