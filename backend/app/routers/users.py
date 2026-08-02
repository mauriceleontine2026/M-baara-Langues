import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from ..database import get_db
from ..services.security import get_current_user, get_password_hash
from ..models.user import User
from sqlalchemy.orm import Session

router = APIRouter()

class UserInviteRequest(BaseModel):
    email: EmailStr

@router.get("")
def list_users(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")
    users = db.query(User).order_by(User.email.asc()).all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "photo_url": user.photo_url,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
        }
        for user in users
    ]

@router.post("/invite", status_code=status.HTTP_201_CREATED)
def invite_user(payload: UserInviteRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    temp_password = secrets.token_urlsafe(12)
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(temp_password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "status": "ok",
        "id": user.id,
        "email": user.email,
        "temporary_password": temp_password,
    }
