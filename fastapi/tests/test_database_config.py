from app.core.config import get_settings


def test_mongodb_settings() -> None:
    settings = get_settings()

    assert settings.mongodb_url.startswith("mongodb")
    assert settings.database_name == "greenvista"
