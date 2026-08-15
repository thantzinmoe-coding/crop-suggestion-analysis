import json

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


def _parse_sse_data(body: str) -> list[dict]:
    return [
        json.loads(line.removeprefix("data: "))
        for line in body.splitlines()
        if line.startswith("data: ")
    ]


@pytest.mark.asyncio
async def test_chat_returns_valid_sse_json(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_stream_chat(messages: list[dict], language: str):
        yield f"Local response to: {messages[-1]['content']}"

    monkeypatch.setattr("app.api.v1.endpoints.chat.stream_chat", fake_stream_chat)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/chat",
            json={"messages": [{"role": "user", "content": "How is my crop?"}]},
        )

    assert response.status_code == 200
    events = _parse_sse_data(response.text)
    assert events[-1] == {"content": "", "done": True}
    assert events[0]["done"] is False
    assert "How is my crop?" in events[0]["content"]


@pytest.mark.asyncio
async def test_crop_explanation_returns_valid_sse_json(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_stream_crop_explanation(
        soil_pH: float,
        rainfall_mm: float,
        temperature_c: float,
        crop: str,
        language: str,
    ):
        yield f"Local explanation for {crop}"

    monkeypatch.setattr(
        "app.api.v1.endpoints.crop_explanation.stream_crop_explanation",
        fake_stream_crop_explanation,
    )
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/crop-explanation",
            json={
                "soil_pH": 6.5,
                "rainfall_mm": 100,
                "temperature_c": 28,
                "crop": "Maize",
            },
        )

    assert response.status_code == 200
    events = _parse_sse_data(response.text)
    assert events[-1] == {"content": "", "done": True}
    assert events[0]["done"] is False
    assert "Maize" in events[0]["content"]
