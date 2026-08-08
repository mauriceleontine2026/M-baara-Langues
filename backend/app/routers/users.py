import hashlib
import re
import secrets
import time
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator
from ..database import get_db
from ..services.security import get_current_user, get_password_hash
from ..models.user import User
from sqlalchemy.orm import Session
from .auth import reset_tokens

router = APIRouter()

INVITE_TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60


def _normalize_email(value: str) -> str:
    return value.strip().lower()


class UserInviteRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = _normalize_email(value)
        if not re.fullmatch(r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$", normalized):
            raise ValueError("Invalid email address")
        return normalized

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
    normalized_email = _normalize_email(payload.email)
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    # The account is created with an unusable random password hash; the
    # invitee sets their own password via the one-time invite token below
    # (reusing the same opaque-token flow as /reset-password), so no
    # credential ever needs to be transmitted in this response.
    user = User(
        email=normalized_email,
        hashed_password=get_password_hash(secrets.token_urlsafe(32)),
        role="user",
        email_verified=False,
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
