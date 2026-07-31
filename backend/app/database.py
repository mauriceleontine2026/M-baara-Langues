import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

# Load root .env file first, then `.env.local`, then fallback to backend/.env if needed.
root_env = Path(__file__).resolve().parents[2] / ".env"
root_env_local = Path(__file__).resolve().parents[2] / ".env.local"
backend_env = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=root_env, override=False)
load_dotenv(dotenv_path=root_env_local, override=False)
load_dotenv(dotenv_path=backend_env, override=False)


def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


def _build_engine(url: str):
    connect_args = {"check_same_thread": False} if _is_sqlite(url) else {}
    return create_engine(url, connect_args=connect_args, pool_pre_ping=True)


DATABASE_URL = os.getenv("DATABASE_URL") or f"sqlite:///{Path(__file__).resolve().parents[2] / 'mbaara.db'}"

try:
    if _is_sqlite(DATABASE_URL):
        engine = _build_engine(DATABASE_URL)
    else:
        engine = _build_engine(DATABASE_URL)
        with engine.connect() as conn:  # type: ignore[attr-defined]
            conn.execute(text("SELECT 1"))
except Exception as exc:  # noqa: BLE001
    fallback_path = Path(__file__).resolve().parents[2] / "mbaara.db"
    fallback_url = f"sqlite:///{fallback_path}"
    logger.warning(
        "Could not connect to DATABASE_URL %s; falling back to %s. Error: %s",
        DATABASE_URL,
        fallback_url,
        exc,
    )
    DATABASE_URL = fallback_url
    engine = _build_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
