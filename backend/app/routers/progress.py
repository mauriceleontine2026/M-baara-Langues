from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.progress import UserProgress
from ..services.security import get_current_user

router = APIRouter()


class ProgressUpdateRequest(BaseModel):
    type: str | None = None
    language_code: str | None = None
    lesson_number: int | None = None
    xp: int | None = None


def _next_unlocked_lesson(completed_lessons: list | None) -> int:
    lessons = []
    if completed_lessons:
        for item in completed_lessons:
            try:
                lessons.append(int(item))
            except (TypeError, ValueError):
                continue
    lessons = sorted(set(lessons))
    next_lesson = 1
    for lesson in lessons:
        if lesson == next_lesson:
            next_lesson += 1
        elif lesson > next_lesson:
            break
    return next_lesson


@router.get("")
def get_progress(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = str(current_user.id)
    progresses = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()
    if not progresses:
        progress = UserProgress(user_id=user_id, language_code="fr", xp=240, streak=6, completed_lessons=[1, 2], next_goal="Terminer 3 leçons cette semaine")
        db.add(progress)
        db.commit()
        db.refresh(progress)
        progresses = [progress]

    return [
        {
            "language_code": progress.language_code,
            "xp": progress.xp,
            "streak": progress.streak,
            "completed_lessons": progress.completed_lessons,
            "current_lesson": _next_unlocked_lesson(progress.completed_lessons),
            "next_goal": progress.next_goal,
        }
        for progress in progresses
    ]


@router.post("")
def update_progress(payload: ProgressUpdateRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = str(current_user.id)
    language_code = payload.language_code or "fr"
    progress = db.query(UserProgress).filter(UserProgress.user_id == user_id, UserProgress.language_code == language_code).first()

    if not progress:
        progress = UserProgress(user_id=user_id, language_code=language_code, xp=0, streak=0, completed_lessons=[], next_goal=None)
        db.add(progress)

    completed_lessons = list(progress.completed_lessons or [])
    if payload.lesson_number is not None and payload.lesson_number not in completed_lessons:
        completed_lessons.append(payload.lesson_number)

    progress.xp = (progress.xp or 0) + (payload.xp or 0)
    progress.streak = (progress.streak or 0) + 1
    progress.completed_lessons = completed_lessons
    progress.language_code = language_code
    if not progress.next_goal:
        progress.next_goal = "Terminer 3 leçons cette semaine"

    db.commit()
    db.refresh(progress)
    completed_lessons = progress.completed_lessons or []
    current_lesson = _next_unlocked_lesson(completed_lessons)
    return {
        "language_code": progress.language_code,
        "xp": progress.xp,
        "streak": progress.streak,
        "completed_lessons": progress.completed_lessons,
        "current_lesson": current_lesson,
        "next_goal": progress.next_goal,
    }
