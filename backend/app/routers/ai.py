import os
import re
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from ..services.security import RateLimiter, get_current_user

router = APIRouter()

_ai_rate_limiter = RateLimiter(max_attempts=10, window_seconds=60)


def _sanitize_text(value: str | None, *, max_length: int, allow_newlines: bool = True) -> str | None:
    if value is None:
        return None
    text = value.strip()
    text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    if not allow_newlines:
        text = text.replace("\n", " ").replace("\r", " ")
    if len(text) > max_length:
        raise ValueError(f"Text exceeds maximum length of {max_length} characters")
    return text


class LLMRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    response_json_schema: dict | None = None
    temperature: float | None = Field(default=0.7, ge=0.0, le=2.0)

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, value: str) -> str:
        return _sanitize_text(value, max_length=4000) or ""

    @field_validator("response_json_schema")
    @classmethod
    def validate_response_json_schema(cls, value: dict | None) -> dict | None:
        if value is None:
            return None
        schema_text = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        if len(schema_text) > 4000:
            raise ValueError("response_json_schema is too large")
        return value


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com")


async def call_openai(prompt: str, temperature: float = 0.7) -> str:
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=501, detail="OpenAI API key not configured")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{OPENAI_API_BASE.rstrip('/')}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                "messages": [
                    {"role": "system", "content": "Tu es un assistant utile, concis et sûr."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": temperature,
                "max_tokens": 500,
            },
        )

    if response.status_code >= 300:
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {response.text}")

    payload = response.json()
    return payload["choices"][0]["message"]["content"].strip()


@router.post("/chat")
async def chat(
    payload: LLMRequest,
    current_user=Depends(get_current_user),
    _rate_limit=Depends(_ai_rate_limiter),
):
    prompt = payload.prompt
    if payload.response_json_schema:
        schema_text = json.dumps(payload.response_json_schema, ensure_ascii=False)
        if len(schema_text) > 4000:
            raise HTTPException(status_code=400, detail="response_json_schema is too large")
        prompt = (
            f"{prompt}\n\nRéponds uniquement en JSON valide qui correspond au schéma suivant :\n{schema_text}"
            + "\nNe renvoie que du JSON."
        )

    content = await call_openai(prompt, payload.temperature or 0.7)

    if payload.response_json_schema:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"content": content}

    return {"content": content}
