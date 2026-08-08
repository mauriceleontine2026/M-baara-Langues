import re
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.contribution import Contribution
from ..services.security import RateLimiter, get_current_user

router = APIRouter()

_contribution_rate_limiter = RateLimiter(max_attempts=10, window_seconds=60)


def _sanitize_text(value: str | None, *, max_length: int, allow_newlines: bool = False) -> str | None:
    if value is None:
        return None
    text = value.strip()
    text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    if not allow_newlines:
        text = text.replace("\n", " ").replace("\r", " ")
    if len(text) > max_length:
        raise ValueError(f"Text exceeds maximum length of {max_length} characters")
    return text


class ContributionCreateRequest(BaseModel):
    language_code: str = Field(..., max_length=50)
    word: str = Field(..., max_length=200)
    translation_fr: str | None = Field(default=None, max_length=200)
    phonetic: str | None = Field(default=None, max_length=200)
    contributor_name: str | None = Field(default=None, max_length=200)
    region: str | None = Field(default=None, max_length=200)
    context_notes: str | None = Field(default=None, max_length=2000)
    audio_url: str | None = Field(default=None, max_length=1000)

    @field_validator("language_code", "word", "translation_fr", "phonetic", "contributor_name", "region", "context_notes")
    @classmethod
    def sanitize_text_fields(cls, value: str | None, info) -> str | None:
        max_length = {
            "language_code": 50,
            "word": 200,
            "translation_fr": 200,
            "phonetic": 200,
            "contributor_name": 200,
            "region": 200,
            "context_notes": 2000,
        }.get(info.field_name, 200)
        return _sanitize_text(value, max_length=max_length, allow_newlines=(info.field_name == "context_notes"))

    @field_validator("audio_url")
    @classmethod
    def validate_audio_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        sanitized = _sanitize_text(value, max_length=1000)
        if sanitized and not sanitized.startswith(("http://", "https://")):
            raise ValueError("audio_url must be an absolute http/https URL")
        return sanitized


class ContributionUpdateRequest(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        sanitized = _sanitize_text(value, max_length=50)
        allowed = {"pending", "approved", "rejected"}
        if sanitized not in allowed:
            raise ValueError("status must be one of: pending, approved, rejected")
        return sanitized


@router.get("")
def list_contributions(created_by_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(Contribution)
    if current_user.role != 'admin':
        query = query.filter(Contribution.created_by_id == str(current_user.id))
    elif created_by_id:
        query = query.filter(Contribution.created_by_id == created_by_id)
    contributions = query.order_by(Contribution.created_at.desc()).all()
    return [
        {
            "id": contrib.id,
            "language_code": contrib.language_code,
            "word": contrib.word,
            "translation_fr": contrib.translation_fr,
            "phonetic": contrib.phonetic,
            "contributor_name": contrib.contributor_name,
            "region": contrib.region,
            "context_notes": contrib.context_notes,
            "audio_url": contrib.audio_url,
            "status": contrib.status,
            "created_by_id": contrib.created_by_id,
            "created_at": contrib.created_at.isoformat(),
        }
        for contrib in contributions
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_contribution(
    payload: ContributionCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    _rate_limit=Depends(_contribution_rate_limiter),
):
    contribution = Contribution(
        language_code=payload.language_code,
        word=payload.word,
        translation_fr=payload.translation_fr,
        phonetic=payload.phonetic,
        contributor_name=payload.contributor_name,
        region=payload.region,
        context_notes=payload.context_notes,
        audio_url=payload.audio_url,
        status="pending",
        created_by_id=str(current_user.id),
    )
    db.add(contribution)
    db.commit()
    db.refresh(contribution)
    return {
        "id": contribution.id,
        "language_code": contribution.language_code,
        "word": contribution.word,
        "translation_fr": contribution.translation_fr,
        "phonetic": contribution.phonetic,
        "contributor_name": contribution.contributor_name,
        "region": contribution.region,
        "context_notes": contribution.context_notes,
        "audio_url": contribution.audio_url,
        "status": contribution.status,
        "created_by_id": contribution.created_by_id,
        "created_at": contribution.created_at.isoformat(),
    }


@router.put("/{contribution_id}")
def update_contribution(contribution_id: int, payload: ContributionUpdateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")
    contribution = db.query(Contribution).filter(Contribution.id == contribution_id).first()
    if not contribution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contribution not found")
    contribution.status = payload.status
    db.add(contribution)
    db.commit()
    db.refresh(contribution)
    return {
        "id": contribution.id,
        "language_code": contribution.language_code,
        "word": contribution.word,
        "translation_fr": contribution.translation_fr,
        "phonetic": contribution.phonetic,
        "contributor_name": contribution.contributor_name,
        "region": contribution.region,
        "context_notes": contribution.context_notes,
        "audio_url": contribution.audio_url,
        "status": contribution.status,
        "created_by_id": contribution.created_by_id,
        "created_at": contribution.created_at.isoformat(),
    }
