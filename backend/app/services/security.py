import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from passlib.hash import pbkdf2_sha256
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..database import SessionLocal
from ..models.user import User

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", "dev-secret-key"))
JWT_PRIVATE_KEY = os.getenv("JWT_PRIVATE_KEY")
JWT_PUBLIC_KEY = os.getenv("JWT_PUBLIC_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256").upper()
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


def _normalize_key(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip()
    if normalized.startswith('"') and normalized.endswith('"'):
        normalized = normalized[1:-1].strip()
    normalized = normalized.replace("\\n", "\n")
    return normalized


def _is_pem_key(value: str | None) -> bool:
    return bool(value and value.strip().startswith("-----BEGIN "))


def _get_signing_key() -> str:
    if ALGORITHM.startswith(("RS", "ES", "PS")):
        signing_key = _normalize_key(JWT_PRIVATE_KEY) or SECRET_KEY
        if not _is_pem_key(signing_key):
            message = (
                "JWT_ALGORITHM is set to '%s', but JWT_PRIVATE_KEY is not a PEM-encoded key. "
                "Set JWT_PRIVATE_KEY to a valid PEM private key or switch JWT_ALGORITHM to HS256."
            ) % ALGORITHM
            logger.error(message)
            raise RuntimeError(message)
        return signing_key
    return SECRET_KEY


def _get_verification_key() -> str:
    if ALGORITHM.startswith(("RS", "ES", "PS")):
        verification_key = JWT_PUBLIC_KEY or JWT_PRIVATE_KEY or SECRET_KEY
        if not _is_pem_key(verification_key):
            message = (
                "JWT_ALGORITHM is set to '%s', but JWT_PUBLIC_KEY / JWT_PRIVATE_KEY is not a PEM-encoded key. "
                "Set JWT_PUBLIC_KEY to a valid PEM public key or provide a PEM private key in JWT_PRIVATE_KEY."
            ) % ALGORITHM
            logger.error(message)
            raise RuntimeError(message)
        return verification_key
    return SECRET_KEY


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pbkdf2_sha256.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pbkdf2_sha256.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, _get_signing_key(), algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, _get_verification_key(), algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _load_admin_emails() -> set[str]:
    raw = os.getenv("ADMIN_EMAILS", "")
    if not raw:
        return set()
    return {email.strip().lower() for email in raw.replace(";", ",").split(",") if email.strip()}

ADMIN_EMAILS = _load_admin_emails()


def is_admin_email(email: str | None) -> bool:
    return bool(email and email.strip().lower() in ADMIN_EMAILS)


def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    email = payload.get("email")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user and email:
            user = db.query(User).filter(User.email == email).first()
        if not user and email:
            user = User(
                email=email,
                hashed_password=get_password_hash(str(uuid.uuid4())),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    finally:
        db.close()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if is_admin_email(user.email):
        setattr(user, "role", "admin")
    elif getattr(user, "role", None) is None:
        setattr(user, "role", "user")
    return user
