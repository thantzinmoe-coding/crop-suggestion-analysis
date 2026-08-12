from datetime import UTC, datetime
from typing import Any

from pymongo import AsyncMongoClient

from app.core.config import get_settings

settings = get_settings()

client: AsyncMongoClient[dict[str, Any]] = AsyncMongoClient(
    settings.mongodb_url,
    serverSelectionTimeoutMS=5000,
)
database = client[settings.mongodb_database]

def get_database() -> Any:
    """Return the shared MongoDB database for FastAPI dependency injection."""
    return database


async def ping_database() -> None:
    await database.command("ping")


async def close_database() -> None:
    await client.close()


def utcnow() -> datetime:
    return datetime.now(UTC)
