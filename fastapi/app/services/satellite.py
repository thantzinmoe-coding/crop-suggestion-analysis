"""Near-real-time NDVI ingestion from Copernicus Data Space.

This uses the Sentinel Hub-compatible Statistics API exposed by CDSE. The
regional boxes are intentionally small approximations until proper Myanmar
administrative GeoJSON boundaries are added to the project.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from httpx import AsyncClient

from app.core.config import get_settings
from app.db.session import get_database
from app.services.weather import PCODE_MAP

EVALSCRIPT = """
//VERSION=3
function setup() {
  return { input: [{ bands: [\"B04\", \"B08\", \"SCL\"] }],
           output: [{ id: \"ndvi\", bands: 1, sampleType: \"FLOAT32\" }] };
}
function evaluatePixel(sample) {
  // SCL 3/8/9/10/11 are shadow, cloud, cirrus and snow classes.
  if ([3, 8, 9, 10, 11].includes(sample.SCL)) return { ndvi: [NaN] };
  let denominator = sample.B08 + sample.B04;
  return { ndvi: [denominator === 0 ? NaN : (sample.B08 - sample.B04) / denominator] };
}
"""


def _bbox_for_region(pcode: str) -> list[float]:
    info = PCODE_MAP.get(pcode)
    if not info:
        raise ValueError(f"Unknown region PCODE: {pcode}")
    lat, lon = info["lat"], info["lon"]
    # Approximate 10 km x 10 km box; replace with administrative boundaries.
    return [lon - 0.05, lat - 0.05, lon + 0.05, lat + 0.05]


async def _token(client: AsyncClient) -> str:
    settings = get_settings()
    if not settings.cdse_client_id or not settings.cdse_client_secret:
        raise RuntimeError("CDSE credentials are not configured")
    response = await client.post(
        settings.cdse_token_url,
        data={
            "grant_type": "client_credentials",
            "client_id": settings.cdse_client_id,
            "client_secret": settings.cdse_client_secret.get_secret_value(),
        },
    )
    response.raise_for_status()
    return response.json()["access_token"]


async def ingest_region(pcode: str, days: int = 14) -> dict[str, Any] | None:
    settings = get_settings()
    if not settings.cdse_enabled:
        return None
    now = datetime.now(UTC)
    start = now - timedelta(days=days)
    payload = {
        "input": {
            "bounds": {"bbox": _bbox_for_region(pcode)},
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "timeRange": {
                        "from": start.isoformat().replace("+00:00", "Z"),
                        "to": now.isoformat().replace("+00:00", "Z"),
                    },
                    "maxCloudCoverage": settings.cdse_cloud_cover_max,
                    "mosaickingOrder": "leastCC",
                },
            }],
        },
        "aggregation": {
            "timeRange": {
                "from": start.isoformat().replace("+00:00", "Z"),
                "to": now.isoformat().replace("+00:00", "Z"),
            },
            "aggregationInterval": {"of": "P1D"},
            "resx": 100,
            "resy": 100,
        },
        "calculations": {"default": {}},
        "evalscript": EVALSCRIPT,
    }
    async with AsyncClient(timeout=90) as client:
        response = await client.post(
            settings.cdse_process_url,
            json=payload,
            headers={"Authorization": f"Bearer {await _token(client)}"},
        )
        response.raise_for_status()
        data = response.json()

    values = data.get("data", [])
    if not values:
        return None
    latest = values[-1]
    bands = latest.get("outputs", {}).get("ndvi", {}).get("bands", {})
    if isinstance(bands, dict):
        stats = next(iter(bands.values()), {}).get("stats", {})
    else:
        stats = bands[0].get("stats", {}) if bands else {}
    mean = stats.get("mean")
    if mean is None:
        return None
    observation_date = latest.get("interval", [now.isoformat()])[0]
    document = {
        "region_pcode": pcode,
        "observation_date": datetime.fromisoformat(observation_date.replace("Z", "+00:00")),
        "mean_ndvi": float(mean),
        "vim": float(mean),
        "viq": 0.0,
        "source": "Copernicus Sentinel-2 L2A",
        "updated_at": now,
    }
    db = get_database()
    await db.ndvi_measurements.update_one(
        {"region_pcode": pcode, "observation_date": document["observation_date"]},
        {"$set": document},
        upsert=True,
    )
    return document


async def ingest_all_regions(days: int = 14) -> dict[str, int]:
    successful = 0
    failed = 0
    for pcode in PCODE_MAP:
        try:
            if await ingest_region(pcode, days):
                successful += 1
        except Exception:
            failed += 1
    return {"successful": successful, "failed": failed}
