from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import health, auth, lessons, progress, audio, ai, languages, vocabulary, contributions, users, leaderboard
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
from .models.language import Language
from .database import SessionLocal

app = FastAPI(title="M'baara API", version="0.1.0")

Base.metadata.create_all(bind=engine)

from sqlalchemy import inspect


def _ensure_user_role_column():
    inspector = inspect(engine)
    if 'users' not in inspector.get_table_names():
        return
    columns = [column['name'] for column in inspector.get_columns('users')]
    if 'role' in columns:
        return
    with engine.connect() as conn:
        conn.execute("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'")


_ensure_user_role_column()


def _seed_default_languages():
    db = SessionLocal()
    try:
        if db.query(Language).count() > 0:
            return
        default_languages = [
            {
                "code": "francais",
                "name": "Français",
                "name_fr": "Français",
                "region": "Monde",
                "family": "Langue mondiale",
                "status": "active",
                "color": "#2563eb",
                "flag_emoji": "🇫🇷",
                "total_lessons": 3,
                "description": "Langue de communication internationale",
            },
            {
                "code": "anglais",
                "name": "English",
                "name_fr": "Anglais",
                "region": "Monde",
                "family": "Langue mondiale",
                "status": "active",
                "color": "#7c3aed",
                "flag_emoji": "🇬🇧",
                "total_lessons": 3,
                "description": "Langue internationale très utilisée",
            },
            {
                "code": "bissa",
                "name": "Bissa",
                "name_fr": "Bissa",
                "region": "Burkina Faso",
                "family": "Langue africaine",
                "status": "active",
                "color": "#16a34a",
                "flag_emoji": "🇧🇫",
                "total_lessons": 3,
                "description": "Langue africaine locale",
            },
        ]
        for payload in default_languages:
            db.add(Language(**payload))
        db.commit()
    finally:
        db.close()


_seed_default_languages()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health, prefix="/api")
app.include_router(auth, prefix="/api/auth")
app.include_router(lessons, prefix="/api/lessons")
app.include_router(progress, prefix="/api/progress")
app.include_router(audio, prefix="/api/audio")
app.include_router(ai, prefix="/api/ai")
app.include_router(leaderboard, prefix="/api/leaderboard")
app.include_router(languages, prefix="/api/languages")
app.include_router(vocabulary, prefix="/api/vocabulary")
app.include_router(contributions, prefix="/api/contributions")
app.include_router(users, prefix="/api/users")

@app.get("/", tags=["root"])
def root():
    return {"message": "M'baara API is running", "health": "/api/health"}

# Serve static files (audio outputs, etc.)
ROOT_DIR = Path(__file__).resolve().parents[2]
STATIC_DIR = Path(os.environ.get("MBAARA_STATIC_DIR", "/tmp/mbaara/static"))
if os.access(ROOT_DIR, os.W_OK):
    STATIC_DIR = ROOT_DIR / "backend" / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
