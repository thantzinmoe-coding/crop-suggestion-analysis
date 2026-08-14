import hashlib
import hmac
import logging
import secrets
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.core.config import get_settings
from app.db.session import get_database

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginCredentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthResponse(BaseModel):
    token: str
    user: dict[str, str]
    email_sent: bool = False


def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 240_000)
    return f"{salt.hex()}${digest.hex()}"


def _check_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split("$", 1)
        expected = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 240_000)
        return hmac.compare_digest(expected.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def _send_welcome_email(recipient: str) -> bool:
    settings = get_settings()
    if not all((settings.smtp_host, settings.smtp_username, settings.smtp_password, settings.smtp_from_email)):
        return False

    message = EmailMessage()
    message["Subject"] = "Welcome to GreenVista"
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message.set_content(
        "Welcome to GreenVista!\n\nYour account has been created successfully. "
        "You can now sign in and explore your crop and field tools."
    )
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        smtp.login(settings.smtp_username, settings.smtp_password.get_secret_value())
        smtp.send_message(message)
    return True


async def _response(user: dict[str, Any], db: Any, email_sent: bool = False) -> AuthResponse:
    token = secrets.token_urlsafe(32)
    user_id = str(user["_id"])
    await db.sessions.insert_one({
        "token": token,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc),
    })
    return AuthResponse(token=token, user={"id": user_id, "email": user["email"]}, email_sent=email_sent)


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(credentials: Credentials, db: Any = Depends(get_database)) -> AuthResponse:
    email = str(credentials.email).lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account already exists with this email.")

    user = {"email": email, "password_hash": _hash_password(credentials.password)}
    result = await db.users.insert_one(user)
    user["_id"] = result.inserted_id
    email_sent = False
    try:
        email_sent = _send_welcome_email(email)
    except (OSError, smtplib.SMTPException) as exc:
        # Do not discard a valid account if the optional mail provider is unavailable.
        logger.warning("Welcome email failed for %s: %s", email, exc)
        email_sent = False
    return await _response(user, db, email_sent)


@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginCredentials, db: Any = Depends(get_database)) -> AuthResponse:
    email = str(credentials.email).lower()
    user = await db.users.find_one({"email": email})
    if not user or not _check_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return await _response(user, db)
