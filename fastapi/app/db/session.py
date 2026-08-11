from collections.abc import AsyncIterator
from typing import Any

from pymongo import AsyncMongoClient

from app.core.config import get_settings

settings = get_settings()
client = AsyncMongoClient(settings.mongodb_url)
database = client[settings.database_name]


def get_database() -> Any:
    return database


async def get_db_session() -> AsyncIterator[Any]:
    yield database


async def ensure_indexes() -> None:
    await database.crop_profiles.create_index("id", unique=True)
    await database.crop_profiles.create_index("name", unique=True)
    await database.regions.create_index("pcode", unique=True)
    await database.ndvi_measurements.create_index([("region_pcode", 1), ("date", 1)])


async def close_database() -> None:
    await client.close()
