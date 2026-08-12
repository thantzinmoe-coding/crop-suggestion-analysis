from app.core.config import Settings


def test_default_mongodb_configuration() -> None:
    settings = Settings(_env_file=None)

    assert settings.mongodb_url == "mongodb://127.0.0.1:27017"
    assert settings.mongodb_database == "crop_ai"


def test_mongodb_configuration_accepts_environment_values(monkeypatch) -> None:
    monkeypatch.setenv("CROP_AI_MONGODB_URL", "mongodb://localhost:27018")
    monkeypatch.setenv("CROP_AI_MONGODB_DATABASE", "crop_ai_test")
    settings = Settings(_env_file=None)

    assert settings.mongodb_url == "mongodb://localhost:27018"
    assert settings.mongodb_database == "crop_ai_test"
