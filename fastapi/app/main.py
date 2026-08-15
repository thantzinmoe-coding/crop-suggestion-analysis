import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import ServerSelectionTimeoutError

from app.api.v1.router import api_router
from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def initialize_database(max_attempts: int = 12, retry_delay: float = 2.0) -> None:
    from app.db.session import ensure_indexes
    from app.seed import init_database

    for attempt in range(1, max_attempts + 1):
        try:
            await ensure_indexes()
            await init_database()
            return
        except ServerSelectionTimeoutError:
            if attempt == max_attempts:
                raise
            logger.warning(
                "MongoDB is not ready (attempt %s/%s); retrying in %.1f seconds",
                attempt,
                max_attempts,
                retry_delay,
            )
            await asyncio.sleep(retry_delay)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    if settings.initialize_database:
        await initialize_database()
    yield

    from app.db.session import close_database

    await close_database()


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix=settings.api_v1_prefix)

    @application.get("/health", include_in_schema=False)
    async def liveness() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()

