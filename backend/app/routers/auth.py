import os
import uuid

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import httpx
from ..database import get_db
from ..models.user import User
from ..services import security
from ..services.security import get_current_user, is_admin_email

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", os.getenv("VITE_FIREBASE_PROJECT_ID"))
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", os.getenv("VITE_FIREBASE_API_KEY"))
FIREBASE_LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup"

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirmRequest(BaseModel):
    resetToken: str
    newPassword: str


class UpdateMeRequest(BaseModel):
    full_name: str | None = None
    photo_url: str | None = None


reset_tokens: dict[str, int] = {}


def _verify_firebase_id_token(id_token_value: str) -> dict:
    if not FIREBASE_API_KEY:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase API key is not configured on the backend.")

    try:
        response = httpx.post(
            FIREBASE_LOOKUP_URL,
            params={"key": FIREBASE_API_KEY},
            json={"idToken": id_token_value},
            timeout=10.0,
        )
        response.raise_for_status()
        payload = response.json()
        users = payload.get("users") or []
        if not users:
            raise ValueError("Jeton Firebase invalide : aucun utilisateur retourné.")

        user = users[0]
        return {
            "email": user.get("email"),
            "name": user.get("displayName"),
            "picture": user.get("photoUrl"),
            "firebase_uid": user.get("localId"),
        }
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Jeton Firebase invalide.") from exc


class FirebaseAuthRequest(BaseModel):
    id_token: str


@router.post("/firebase")
def firebase_auth(payload: FirebaseAuthRequest, db: Session = Depends(get_db)):
    token_payload = _verify_firebase_id_token(payload.id_token)
    email = token_payload.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="L'email Firebase est requis.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        role = "admin" if is_admin_email(email) else "user"
        user = User(
            email=email,
            hashed_password=security.get_password_hash(uuid.uuid4().hex),
            full_name=token_payload.get("name"),
            photo_url=token_payload.get("picture"),
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        updated = False
        if is_admin_email(email) and user.role != "admin":
            user.role = "admin"
            updated = True
        if not user.full_name and token_payload.get("name"):
            user.full_name = token_payload.get("name")
            updated = True
        if not user.photo_url and token_payload.get("picture"):
            user.photo_url = token_payload.get("picture")
            updated = True
        if updated:
            db.add(user)
            db.commit()
            db.refresh(user)

    token = security.create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "photo_url": user.photo_url,
            "role": user.role,
        },
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(
        email=payload.email,
        hashed_password=security.get_password_hash(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = security.create_access_token({"sub": str(user.id), "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "photo_url": user.photo_url, "role": user.role}}


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not security.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = security.create_access_token({"sub": str(user.id), "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "photo_url": user.photo_url, "role": user.role}}


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "photo_url": current_user.photo_url,
        "role": current_user.role,
    }


@router.put("/me")
def update_me(payload: UpdateMeRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.photo_url is not None:
        user.photo_url = payload.photo_url
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "photo_url": user.photo_url,
        "role": user.role,
    }


@router.post("/reset-password-request")
def reset_password_request(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        token = security.create_access_token({"sub": str(user.id), "email": user.email})
        reset_tokens[token] = user.id
    return {"status": "ok"}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordConfirmRequest, db: Session = Depends(get_db)):
    user_id = reset_tokens.get(payload.resetToken)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.hashed_password = security.get_password_hash(payload.newPassword)
    db.add(user)
    db.commit()
    del reset_tokens[payload.resetToken]
    return {"status": "ok"}
