import hashlib
import os
import re
import secrets
import time
import uuid
from collections import defaultdict, deque

from fastapi import APIRouter, HTTPException, Depends, Request, Response, status, Form
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session
import httpx
from ..database import get_db
from ..models.user import User
from ..services import security
from ..services.security import get_current_user, is_admin_email

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", os.getenv("VITE_FIREBASE_PROJECT_ID"))
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", os.getenv("VITE_FIREBASE_API_KEY"))
FIREBASE_LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup"
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY") or os.getenv("VITE_RECAPTCHA_SECRET_KEY")
RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

router = APIRouter()

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_ATTEMPTS = 5
LOGIN_FAILURE_WINDOW_SECONDS = 15 * 60
LOGIN_FAILURE_MAX_ATTEMPTS = 5
_rate_limit_buckets: dict[str, deque[float]] = defaultdict(deque)
_login_failure_buckets: dict[str, deque[float]] = defaultdict(deque)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _check_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    bucket = _rate_limit_buckets[client_ip]
    while bucket and now - bucket[0] > RATE_LIMIT_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please retry later.",
        )
    bucket.append(now)


def _record_login_failure(email: str) -> None:
    key = _normalize_email(email)
    now = time.monotonic()
    bucket = _login_failure_buckets[key]
    while bucket and now - bucket[0] > LOGIN_FAILURE_WINDOW_SECONDS:
        bucket.popleft()
    bucket.append(now)
    if len(bucket) >= LOGIN_FAILURE_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please retry later.",
        )


def _clear_login_failures(email: str) -> None:
    _login_failure_buckets.pop(_normalize_email(email), None)


def _validate_password_strength(password: str) -> str:
    if len(password) < 12 or len(password) > 128:
        raise ValueError("Password must be between 12 and 128 characters long")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r"[^A-Za-z0-9]", password):
        raise ValueError("Password must contain at least one special character")
    return password


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12, max_length=128)
    full_name: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password_strength(value)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirmRequest(BaseModel):
    resetToken: str
    newPassword: str = Field(..., min_length=12, max_length=128)

    @field_validator("newPassword")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password_strength(value)


class UpdateMeRequest(BaseModel):
    full_name: str | None = None
    photo_url: str | None = None


reset_tokens: dict[str, tuple[int, float]] = {}
email_verification_tokens: dict[str, tuple[int, float]] = {}


def _is_valid_email_address(email: str) -> bool:
    return bool(re.match(r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$", email.strip()))


def verify_recaptcha_token(token: str | None, action: str = "login") -> None:
    if not RECAPTCHA_SECRET_KEY:
        return
    if not token or not token.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le test anti-bot est requis.")

    try:
        response = httpx.post(
            RECAPTCHA_VERIFY_URL,
            data={"secret": RECAPTCHA_SECRET_KEY, "response": token.strip(), "remoteip": None},
            timeout=10.0,
        )
        response.raise_for_status()
        payload = response.json()
        if not payload.get("success"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Échec de la vérification anti-bot.")
        if payload.get("action") and action and payload.get("action") != action:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action anti-bot invalide.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vérification anti-bot indisponible.") from exc


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
def firebase_auth(payload: FirebaseAuthRequest, response: Response, db: Session = Depends(get_db)):
    token_payload = _verify_firebase_id_token(payload.id_token)
    email = token_payload.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="L'email Firebase est requis.")
    if not _is_valid_email_address(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adresse e-mail invalide.")

    user = db.query(User).filter(User.email == email).first()
    firebase_email_verified = bool(token_payload.get("emailVerified", True))
    if not user:
        role = "admin" if is_admin_email(email) else "user"
        user = User(
            email=email,
            hashed_password=security.get_password_hash(uuid.uuid4().hex),
            full_name=token_payload.get("name"),
            photo_url=token_payload.get("picture"),
            role=role,
            email_verified=firebase_email_verified,
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
        if user.email_verified is not firebase_email_verified:
            user.email_verified = firebase_email_verified
            updated = True
        if updated:
            db.add(user)
            db.commit()
            db.refresh(user)

    token = security.create_access_token({"sub": str(user.id), "email": user.email})
    security.set_auth_cookies(response, token)
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


@router.post("/firebase/form")
def firebase_auth_form(id_token: str = Form(...), response: Response = None, db: Session = Depends(get_db)):
    """
    Form-based Firebase auth endpoint: accepts application/x-www-form-urlencoded
    with id_token field. Useful as a fallback when XHR CORS fails.
    Reuses the same token verification and user creation logic.
    """
    if response is None:
        response = Response()
    
    token_payload = _verify_firebase_id_token(id_token)
    email = token_payload.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="L'email Firebase est requis.")
    if not _is_valid_email_address(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adresse e-mail invalide.")

    user = db.query(User).filter(User.email == email).first()
    firebase_email_verified = bool(token_payload.get("emailVerified", True))
    if not user:
        role = "admin" if is_admin_email(email) else "user"
        user = User(
            email=email,
            hashed_password=security.get_password_hash(uuid.uuid4().hex),
            full_name=token_payload.get("name"),
            photo_url=token_payload.get("picture"),
            role=role,
            email_verified=firebase_email_verified,
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
        if user.email_verified is not firebase_email_verified:
            user.email_verified = firebase_email_verified
            updated = True
        if updated:
            db.add(user)
            db.commit()
            db.refresh(user)

    token = security.create_access_token({"sub": str(user.id), "email": user.email})
    security.set_auth_cookies(response, token)
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


@router.post("/verify-email-request")
def request_email_verification(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    _check_rate_limit(request)
    email = _normalize_email(payload.email)
    if not _is_valid_email_address(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adresse e-mail invalide.")
    user = db.query(User).filter(User.email == email).first()
    if user:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        email_verification_tokens[token_hash] = (user.id, time.time() + (15 * 60))
    return {"status": "ok"}


@router.post("/verify-email")
def verify_email(request: Request, payload: ResetPasswordConfirmRequest, db: Session = Depends(get_db)):
    _check_rate_limit(request)
    token_hash = hashlib.sha256(payload.resetToken.encode("utf-8")).hexdigest()
    stored = email_verification_tokens.get(token_hash)
    if not stored:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")
    user_id, expires_at = stored
    if time.time() > expires_at:
        del email_verification_tokens[token_hash]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification token expired")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.email_verified = True
    db.add(user)
    db.commit()
    del email_verification_tokens[token_hash]
    return {"status": "ok", "email_verified": True}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: Request, response: Response, payload: RegisterRequest, db: Session = Depends(get_db)):
    _check_rate_limit(request)
    normalized_email = _normalize_email(payload.email)
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if not _is_valid_email_address(normalized_email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adresse e-mail invalide.")

    captcha_token = request.headers.get("x-captcha-token")
    if RECAPTCHA_SECRET_KEY and (not captcha_token or not captcha_token.strip()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le test anti-bot est requis.")
    verify_recaptcha_token(captcha_token, "register")

    admin_email = is_admin_email(normalized_email)
    user = User(
        email=normalized_email,
        hashed_password=security.get_password_hash(payload.password),
        full_name=payload.full_name,
        role="admin" if admin_email else "user",
        email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = security.create_access_token({"sub": str(user.id), "email": user.email})
    security.set_auth_cookies(response, token)
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "photo_url": user.photo_url, "role": user.role}}


@router.post("/login")
def login(request: Request, response: Response, payload: LoginRequest, db: Session = Depends(get_db)):
    _check_rate_limit(request)
    normalized_email = _normalize_email(payload.email)

    captcha_token = request.headers.get("x-captcha-token")
    if RECAPTCHA_SECRET_KEY and (not captcha_token or not captcha_token.strip()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le test anti-bot est requis.")
    verify_recaptcha_token(captcha_token, "login")

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not security.verify_password(payload.password, user.hashed_password):
        _record_login_failure(normalized_email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not getattr(user, "email_verified", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")

    _clear_login_failures(normalized_email)

    if is_admin_email(user.email) and user.role != "admin":
        user.role = "admin"
        db.add(user)
        db.commit()
        db.refresh(user)

    token = security.create_access_token({"sub": str(user.id), "email": user.email})
    security.set_auth_cookies(response, token)
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "photo_url": user.photo_url, "role": user.role}}


@router.post("/logout")
def logout(response: Response):
    security.clear_auth_cookies(response)
    return {"status": "ok"}


@router.post("/logout/form")
def logout_form(response: Response):
    """
    Form-based logout endpoint: accepts application/x-www-form-urlencoded.
    Useful as a fallback when XHR CORS fails.
    """
    security.clear_auth_cookies(response)
    # Redirect to home page after logout (form submission)
    return {"status": "ok", "redirect": "/"}


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
def reset_password_request(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    _check_rate_limit(request)
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        # Opaque, single-purpose token: unlike a signed JWT, it carries no
        # claims and is not accepted by get_current_user, so leaking it only
        # exposes the password-reset action, not full account access.
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        reset_tokens[token_hash] = (user.id, time.time() + (15 * 60))
        # TODO: deliver `token` to the user out-of-band (email). No email
        # provider is wired up yet, so nothing is sent today — this endpoint
        # currently only issues a token without a delivery channel.
    return {"status": "ok"}


@router.post("/reset-password")
def reset_password(request: Request, payload: ResetPasswordConfirmRequest, db: Session = Depends(get_db)):
    _check_rate_limit(request)
    token_hash = hashlib.sha256(payload.resetToken.encode("utf-8")).hexdigest()
    stored = reset_tokens.get(token_hash)
    if not stored:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")

    user_id, expires_at = stored
    if time.time() > expires_at:
        del reset_tokens[token_hash]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token expired")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.hashed_password = security.get_password_hash(payload.newPassword)
    db.add(user)
    db.commit()
    del reset_tokens[token_hash]
    return {"status": "ok"}
