from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.progress import UserProgress
from ..models.user import User
from ..services.security import get_current_user

router = APIRouter()


def get_leaderboard(db: Session):
    progresses = db.query(UserProgress).all()
    user_xp = {}
    user_stats = {}

    for progress in progresses:
        uid = str(progress.user_id)
        user_xp[uid] = (user_xp.get(uid, 0) + (progress.xp or 0))
        stats = user_stats.setdefault(uid, {
            "streak": 0,
            "langs": 0,
            "completed_lessons": 0,
        })
        stats["streak"] = max(stats["streak"], progress.streak or 0)
        stats["langs"] += 1
        stats["completed_lessons"] += len(progress.completed_lessons or [])

    users = db.query(User).filter(User.id.in_([int(uid) for uid in user_xp.keys()])).all()
    user_map = {str(user.id): user for user in users}

    entries = []
    for uid, xp in user_xp.items():
        user = user_map.get(uid)
        name = user.full_name or (user.email.split("@")[0] if user and user.email else f"Apprenant {uid[-4:]}")
        entries.append({
            "userId": uid,
            "xp": xp,
            "streak": user_stats[uid]["streak"],
            "langs": user_stats[uid]["langs"],
            "completed_lessons": user_stats[uid]["completed_lessons"],
            "name": name,
        })

    entries.sort(key=lambda x: x["xp"], reverse=True)
    for index, entry in enumerate(entries, start=1):
        entry["rank"] = index

    return entries


@router.get("")
def list_leaderboard(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return get_leaderboard(db)
