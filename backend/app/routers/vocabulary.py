from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.vocabulary import VocabularyItem

router = APIRouter()

class VocabularyCreateRequest(BaseModel):
    language_code: str
    lesson_number: int
    word: str
    translation_fr: str | None = None
    phonetic: str | None = None
    example_target: str | None = None
    example_fr: str | None = None
    audio_url: str | None = None
    difficulty: str | None = None

class VocabularyUpdateRequest(BaseModel):
    lesson_number: int | None = None
    word: str | None = None
    translation_fr: str | None = None
    phonetic: str | None = None
    example_target: str | None = None
    example_fr: str | None = None
    audio_url: str | None = None
    difficulty: str | None = None


@router.get("")
def list_vocabulary(language_code: str | None = None, lesson_number: int | None = None, db: Session = Depends(get_db)):
    query = db.query(VocabularyItem)
    if language_code:
        query = query.filter(VocabularyItem.language_code == language_code)
    if lesson_number is not None:
        query = query.filter(VocabularyItem.lesson_number == lesson_number)
    items = query.order_by(VocabularyItem.lesson_number.asc(), VocabularyItem.id.asc()).all()
    return [
        {
            "id": item.id,
            "language_code": item.language_code,
            "lesson_number": item.lesson_number,
            "word": item.word,
            "translation_fr": item.translation_fr,
            "phonetic": item.phonetic,
            "example_target": item.example_target,
            "example_fr": item.example_fr,
            "audio_url": item.audio_url,
            "difficulty": item.difficulty,
        }
        for item in items
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_vocabulary(payload: VocabularyCreateRequest, db: Session = Depends(get_db)):
    item = VocabularyItem(
        language_code=payload.language_code,
        lesson_number=payload.lesson_number,
        word=payload.word,
        translation_fr=payload.translation_fr,
        phonetic=payload.phonetic,
        example_target=payload.example_target,
        example_fr=payload.example_fr,
        audio_url=payload.audio_url,
        difficulty=payload.difficulty,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id,
        "language_code": item.language_code,
        "lesson_number": item.lesson_number,
        "word": item.word,
        "translation_fr": item.translation_fr,
        "phonetic": item.phonetic,
        "example_target": item.example_target,
        "example_fr": item.example_fr,
        "audio_url": item.audio_url,
        "difficulty": item.difficulty,
    }


@router.put("/{item_id}")
def update_vocabulary(item_id: int, payload: VocabularyUpdateRequest, db: Session = Depends(get_db)):
    item = db.query(VocabularyItem).filter(VocabularyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vocabulary item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id,
        "language_code": item.language_code,
        "lesson_number": item.lesson_number,
        "word": item.word,
        "translation_fr": item.translation_fr,
        "phonetic": item.phonetic,
        "example_target": item.example_target,
        "example_fr": item.example_fr,
        "audio_url": item.audio_url,
        "difficulty": item.difficulty,
    }


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vocabulary(item_id: int, db: Session = Depends(get_db)):
    item = db.query(VocabularyItem).filter(VocabularyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vocabulary item not found")
    db.delete(item)
    db.commit()
    return {"success": True}
