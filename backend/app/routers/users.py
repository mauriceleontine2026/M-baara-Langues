import hashlib
import secrets
import time
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from ..database import get_db
from ..services.security import get_current_user, get_password_hash
from ..models.user import User
from sqlalchemy.orm import Session
from .auth import reset_tokens

router = APIRouter()

INVITE_TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60

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
    # The account is created with an unusable random password hash; the
    # invitee sets their own password via the one-time invite token below
    # (reusing the same opaque-token flow as /reset-password), so no
    # credential ever needs to be transmitted in this response.
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(secrets.token_urlsafe(32)),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    invite_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(invite_token.encode("utf-8")).hexdigest()
    reset_tokens[token_hash] = (user.id, time.time() + INVITE_TOKEN_EXPIRE_SECONDS)

    return {
        "status": "ok",
        "id": user.id,
        "email": user.email,
        "invite_token": invite_token,
    }
