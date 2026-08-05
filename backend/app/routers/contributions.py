from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.contribution import Contribution
from ..services.security import RateLimiter, get_current_user

router = APIRouter()

_contribution_rate_limiter = RateLimiter(max_attempts=10, window_seconds=60)

class ContributionCreateRequest(BaseModel):
    language_code: str = Field(..., max_length=50)
    word: str = Field(..., max_length=200)
    translation_fr: str | None = Field(default=None, max_length=200)
    phonetic: str | None = Field(default=None, max_length=200)
    contributor_name: str | None = Field(default=None, max_length=200)
    region: str | None = Field(default=None, max_length=200)
    context_notes: str | None = Field(default=None, max_length=2000)
    audio_url: str | None = Field(default=None, max_length=1000)

class ContributionUpdateRequest(BaseModel):
    status: str


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
