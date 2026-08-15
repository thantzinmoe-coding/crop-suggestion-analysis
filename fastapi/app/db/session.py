from collections.abc import AsyncIterator
from typing import Any

from pymongo import AsyncMongoClient

from app.core.config import get_settings

settings = get_settings()
client = AsyncMongoClient(
    settings.mongodb_url,
    serverSelectionTimeoutMS=5_000,
    connectTimeoutMS=5_000,
)
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
    await database.ndvi_measurements.create_index(
        [("region_pcode", 1), ("observation_date", 1)], unique=True
    )
    await database.users.create_index("email", unique=True)
    await database.sessions.create_index("token", unique=True)
    await database.farm_profiles.create_index("user_id", unique=True)
    await database.monitoring_preferences.create_index("user_id", unique=True)
    await database.favorite_crops.create_index([("user_id", 1), ("crop_key", 1)], unique=True)
    await database.recommendation_history.create_index([("user_id", 1), ("created_at", -1)])
    await database.chat_conversations.create_index([("user_id", 1), ("updated_at", -1)])
    await database.chat_conversations.create_index("id", unique=True)


async def close_database() -> None:
    await client.close()
