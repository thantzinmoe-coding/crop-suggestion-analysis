from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.media import UPLOAD_DIR, ensure_upload_directories
from app.db.session import close_database, ping_database


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    try:
        await ping_database()
        if get_settings().initialize_database:
            from app.seed import init_database

            await init_database()
        yield
    finally:
        await close_database()


def create_app() -> FastAPI:
    settings = get_settings()
    ensure_upload_directories()
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
    application.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

    @application.get("/health", include_in_schema=False)
    async def liveness() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()

