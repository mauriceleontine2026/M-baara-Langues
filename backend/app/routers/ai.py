from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
import os
import json
import httpx

from ..services.security import RateLimiter, get_current_user

router = APIRouter()

_ai_rate_limiter = RateLimiter(max_attempts=10, window_seconds=60)


class LLMRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    response_json_schema: dict | None = None
    temperature: float | None = Field(default=0.7, ge=0.0, le=2.0)


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
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "Tu es un assistant utile."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": temperature,
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
