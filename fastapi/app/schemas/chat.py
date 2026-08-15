from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.base import APIModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    language: Literal["en", "my"] = "en"


class StoredChatMessage(APIModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=20_000)


class ChatConversationCreate(APIModel):
    title: str = Field(min_length=1, max_length=120)
    language: Literal["en", "my"] = "en"
    messages: list[StoredChatMessage] = Field(min_length=1, max_length=200)


class ChatConversationUpdate(ChatConversationCreate):
    pass
