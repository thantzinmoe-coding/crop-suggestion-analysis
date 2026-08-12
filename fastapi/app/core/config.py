from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "GreenVista API"
    app_version: str = "0.1.0"
    environment: Literal["development", "test", "production"] = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "agroguard"
    initialize_database: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]

    telegram_bot_token: SecretStr | None = None
    telegram_chat_id: str | None = None

    llm_api_key: SecretStr | None = None
    llm_endpoint: str = "http://localhost:11434/v1"
    llm_model: str = "gemma3:latest"
    openweather_api_key: SecretStr | None = None
    openweather_base_url: str = "https://api.openweathermap.org"

    # Copernicus Data Space (Sentinel Hub-compatible) integration.
    cdse_client_id: str | None = None
    cdse_client_secret: SecretStr | None = None
    cdse_token_url: str = (
        "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    )
    cdse_process_url: str = "https://sh.dataspace.copernicus.eu/api/v1/statistics"
    cdse_enabled: bool = False
    cdse_cloud_cover_max: float = 40.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="AGROGUARD_",
        extra="ignore",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

