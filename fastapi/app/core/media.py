from pathlib import Path

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
COMMUNITY_MEDIA_DIR = UPLOAD_DIR / "community"


def ensure_upload_directories() -> None:
    COMMUNITY_MEDIA_DIR.mkdir(parents=True, exist_ok=True)
