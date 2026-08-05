from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.language import Language
from ..services.security import require_admin

router = APIRouter()

class LanguageCreateRequest(BaseModel):
    code: str
    name: str
    name_fr: str | None = None
    region: str | None = None
    family: str | None = None
    status: str | None = "active"
    color: str | None = None
    flag_emoji: str | None = None
    total_lessons: int | None = 0
    description: str | None = None


@router.get("")
def list_languages(status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Language)
    if status:
        query = query.filter(Language.status == status)
    languages = query.order_by(Language.name.asc()).all()
    return [
        {
            "id": lang.id,
            "code": lang.code,
            "name": lang.name,
            "name_fr": lang.name_fr,
            "region": lang.region,
            "family": lang.family,
            "status": lang.status,
            "color": lang.color,
            "flag_emoji": lang.flag_emoji,
            "total_lessons": lang.total_lessons,
            "description": lang.description,
        }
        for lang in languages
    ]


@router.get("/{code}")
def get_language(code: str, db: Session = Depends(get_db)):
    language = db.query(Language).filter(Language.code == code).first()
    if not language:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found")
    return {
        "id": language.id,
        "code": language.code,
        "name": language.name,
        "name_fr": language.name_fr,
        "region": language.region,
        "family": language.family,
        "status": language.status,
        "color": language.color,
        "flag_emoji": language.flag_emoji,
        "total_lessons": language.total_lessons,
        "description": language.description,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_language(payload: LanguageCreateRequest, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    existing = db.query(Language).filter(Language.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Language code already exists")
    language = Language(
        code=payload.code,
        name=payload.name,
        name_fr=payload.name_fr or payload.name,
        region=payload.region,
        family=payload.family,
        status=payload.status or "active",
        color=payload.color,
        flag_emoji=payload.flag_emoji,
        total_lessons=payload.total_lessons or 0,
        description=payload.description,
    )
    db.add(language)
    db.commit()
    db.refresh(language)
    return {
        "id": language.id,
        "code": language.code,
        "name": language.name,
        "name_fr": language.name_fr,
        "region": language.region,
        "family": language.family,
        "status": language.status,
        "color": language.color,
        "flag_emoji": language.flag_emoji,
        "total_lessons": language.total_lessons,
        "description": language.description,
    }
