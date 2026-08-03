from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.lesson import Lesson
from ..services.security import get_current_user

router = APIRouter()


class LessonCreateRequest(BaseModel):
    title: str
    language_code: str
    lesson_number: int | None = None
    difficulty: str | None = None
    content: str | None = None
    published: bool | None = None
    description: str | None = None
    title_fr: str | None = None
    level: str | None = None
    type: str | None = None
    order: int | None = None


class LessonUpdateRequest(BaseModel):
    title: str | None = None
    language_code: str | None = None
    lesson_number: int | None = None
    difficulty: str | None = None
    content: str | None = None
    published: bool | None = None
    description: str | None = None
    title_fr: str | None = None
    level: str | None = None
    type: str | None = None
    order: int | None = None


@router.get("")
def list_lessons(language_code: str | None = None, lesson_number: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Lesson).filter(Lesson.published.is_(True))
    if language_code:
        query = query.filter(Lesson.language_code == language_code)
    if lesson_number is not None:
        query = query.filter(Lesson.lesson_number == lesson_number)
    lessons = query.order_by(Lesson.lesson_number.asc()).all()
    if not lessons and not language_code:
        db.add_all([
            Lesson(title="Saluer", language_code="fr", lesson_number=1, difficulty="beginner", content="Commencez par saluer en français."),
            Lesson(title="Se présenter", language_code="fr", lesson_number=2, difficulty="beginner", content="Apprenez à vous présenter."),
            Lesson(title="Parler du quotidien", language_code="fr", lesson_number=3, difficulty="intermediate", content="Pratiquez les situations courantes."),
        ])
        db.commit()
        lessons = db.query(Lesson).filter(Lesson.published.is_(True)).order_by(Lesson.lesson_number.asc()).all()
    return [
        {
            "id": lesson.id,
            "title": lesson.title,
            "language_code": lesson.language_code,
            "lesson_number": lesson.lesson_number,
            "difficulty": lesson.difficulty,
            "content": lesson.content,
            "published": lesson.published,
            "description": getattr(lesson, "description", None),
            "title_fr": getattr(lesson, "title_fr", None),
            "level": getattr(lesson, "level", None),
            "type": getattr(lesson, "type", None),
            "order": getattr(lesson, "order", None),
        }
        for lesson in lessons
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_lesson(payload: LessonCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")
    lesson = Lesson(
        title=payload.title,
        language_code=payload.language_code,
        lesson_number=payload.lesson_number or 1,
        difficulty=payload.difficulty or "beginner",
        content=payload.content,
        published=payload.published if payload.published is not None else True,
    )
    if payload.description is not None:
        lesson.description = payload.description
    if payload.title_fr is not None:
        lesson.title_fr = payload.title_fr
    if payload.level is not None:
        lesson.level = payload.level
    if payload.type is not None:
        lesson.type = payload.type
    if payload.order is not None:
        lesson.order = payload.order
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return {
        "id": lesson.id,
        "title": lesson.title,
        "language_code": lesson.language_code,
        "lesson_number": lesson.lesson_number,
        "difficulty": lesson.difficulty,
        "content": lesson.content,
        "published": lesson.published,
        "description": getattr(lesson, "description", None),
        "title_fr": getattr(lesson, "title_fr", None),
        "level": getattr(lesson, "level", None),
        "type": getattr(lesson, "type", None),
        "order": getattr(lesson, "order", None),
    }


@router.put("/{lesson_id}")
def update_lesson(lesson_id: int, payload: LessonUpdateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return {
        "id": lesson.id,
        "title": lesson.title,
        "language_code": lesson.language_code,
        "lesson_number": lesson.lesson_number,
        "difficulty": lesson.difficulty,
        "content": lesson.content,
        "published": lesson.published,
        "description": getattr(lesson, "description", None),
        "title_fr": getattr(lesson, "title_fr", None),
        "level": getattr(lesson, "level", None),
        "type": getattr(lesson, "type", None),
        "order": getattr(lesson, "order", None),
    }
