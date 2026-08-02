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
            {"code": "pular", "name": "Pular", "name_fr": "Pular (Fouta Djallon)", "region": "Guinée", "family": "Atlantique", "status": "active", "color": "#D4622A", "flag_emoji": "🇬🇳", "total_lessons": 20, "description": "Langue peule de Guinée"},
            {"code": "soussou", "name": "Soussou", "name_fr": "Soussou", "region": "Guinée", "family": "Atlantique", "status": "active", "color": "#E8A838", "flag_emoji": "🇬🇳", "total_lessons": 20, "description": "Langue côtière de Guinée"},
            {"code": "malinke", "name": "Malinké", "name_fr": "Malinké", "region": "Guinée", "family": "Mandé", "status": "active", "color": "#2E7D32", "flag_emoji": "🇬🇳", "total_lessons": 20, "description": "Langue mandingue de Guinée"},
            {"code": "fulfulde", "name": "Fulfulde", "name_fr": "Fulfulde", "region": "Burkina Faso", "family": "Atlantique", "status": "coming_soon", "color": "#C62828", "flag_emoji": "🇧🇫", "total_lessons": 0, "description": "Langue peule du Burkina"},
            {"code": "guerze", "name": "Guerzé (Kpelé)", "name_fr": "Guerzé", "region": "Guinée Forestière", "family": "Kru", "status": "active", "color": "#5C3D91", "flag_emoji": "🇬🇳", "total_lessons": 20, "description": "Langue de la Guinée forestière"},
            {"code": "dioula", "name": "Dioula", "name_fr": "Dioula", "region": "Burkina Faso / Côte d'Ivoire", "family": "Mandé", "status": "coming_soon", "color": "#00695C", "flag_emoji": "🇧🇫", "total_lessons": 0, "description": "Langue commerciale d'Afrique de l'Ouest"},
            {"code": "lingala", "name": "Lingala", "name_fr": "Lingala", "region": "Congo / RDC", "family": "Bantoue", "status": "active", "color": "#B71C1C", "flag_emoji": "🇨🇩", "total_lessons": 5, "description": "Langue nationale du Congo"},
            {"code": "swahili", "name": "Swahili", "name_fr": "Swahili", "region": "Afrique de l'Est", "family": "Bantoue", "status": "coming_soon", "color": "#004D40", "flag_emoji": "🌍", "total_lessons": 0, "description": "Langue africaine la plus parlée"},
            {"code": "bissa", "name": "Bissa", "name_fr": "Bissa", "region": "Burkina Faso", "family": "Gur", "status": "coming_soon", "color": "#558B2F", "flag_emoji": "🇧🇫", "total_lessons": 0, "description": "Langue du Burkina Faso"},
            {"code": "kissi", "name": "Kissi", "name_fr": "Kissi", "region": "Guinée Forestière", "family": "Atlantique", "status": "coming_soon", "color": "#AD1457", "flag_emoji": "🇬🇳", "total_lessons": 0, "description": "Langue de Guinée forestière"},
            {"code": "kono", "name": "Kono", "name_fr": "Kono", "region": "Guinée", "family": "Mandé", "status": "coming_soon", "color": "#6D4C41", "flag_emoji": "🇬🇳", "total_lessons": 0, "description": "Langue guinéenne"},
            {"code": "toma", "name": "Toma", "name_fr": "Toma", "region": "Guinée Forestière", "family": "Mandé", "status": "coming_soon", "color": "#1565C0", "flag_emoji": "🇬🇳", "total_lessons": 0, "description": "Langue forestière guinéenne"},
            {"code": "moore", "name": "Mooré", "name_fr": "Mooré", "region": "Burkina Faso", "family": "Gur", "status": "coming_soon", "color": "#EF6C00", "flag_emoji": "🇧🇫", "total_lessons": 0, "description": "Langue du Burkina Faso"},
            {"code": "wolof", "name": "Wolof", "name_fr": "Wolof", "region": "Sénégal", "family": "Atlantique", "status": "coming_soon", "color": "#1B5E20", "flag_emoji": "🇸🇳", "total_lessons": 0, "description": "Langue nationale du Sénégal"},
            {"code": "yoruba", "name": "Yoruba", "name_fr": "Yoruba", "region": "Nigeria", "family": "Niger-Congo", "status": "coming_soon", "color": "#4A148C", "flag_emoji": "🇳🇬", "total_lessons": 0, "description": "Langue du sud-ouest nigérian"},
            {"code": "igbo", "name": "Igbo", "name_fr": "Igbo", "region": "Nigeria", "family": "Niger-Congo", "status": "coming_soon", "color": "#01579B", "flag_emoji": "🇳🇬", "total_lessons": 0, "description": "Langue du sud-est nigérian"},
            {"code": "nouchi", "name": "Nouchi", "name_fr": "Nouchi", "region": "Côte d'Ivoire", "family": "Argot franco-africain", "status": "active", "color": "#F57F17", "flag_emoji": "🇨🇮", "total_lessons": 5, "description": "Argot ivoirien"},
            {"code": "anglais", "name": "English", "name_fr": "Anglais", "region": "Monde", "family": "Germanique", "status": "active", "color": "#880E4F", "flag_emoji": "🇬🇧", "total_lessons": 20, "description": "Langue germanique internationale"},
            {"code": "francais", "name": "Français", "name_fr": "Français", "region": "Monde", "family": "Roman", "status": "active", "color": "#1565C0", "flag_emoji": "🇫🇷", "total_lessons": 20, "description": "Langue romane internationale"},
            {"code": "espagnol", "name": "Español", "name_fr": "Espagnol", "region": "Monde", "family": "Roman", "status": "active", "color": "#E65100", "flag_emoji": "🇪🇸", "total_lessons": 20, "description": "Langue romane internationale"},
            {"code": "allemand", "name": "Deutsch", "name_fr": "Allemand", "region": "Europe", "family": "Germanique", "status": "active", "color": "#212121", "flag_emoji": "🇩🇪", "total_lessons": 20, "description": "Langue germanique"},
            {"code": "italien", "name": "Italiano", "name_fr": "Italien", "region": "Europe", "family": "Roman", "status": "active", "color": "#2E7D32", "flag_emoji": "🇮🇹", "total_lessons": 20, "description": "Langue romane"},
            {"code": "portugais", "name": "Português", "name_fr": "Portugais", "region": "Monde", "family": "Roman", "status": "active", "color": "#1B5E20", "flag_emoji": "🇵🇹", "total_lessons": 20, "description": "Langue romane internationale"},
            {"code": "russe", "name": "Русский", "name_fr": "Russe", "region": "Monde", "family": "Slave", "status": "active", "color": "#B71C1C", "flag_emoji": "🇷🇺", "total_lessons": 20, "description": "Langue slave internationale"},
            {"code": "arabe", "name": "العربية", "name_fr": "Arabe", "region": "Monde arabe", "family": "Sémitique", "status": "active", "color": "#1A237E", "flag_emoji": "🇸🇦", "total_lessons": 20, "description": "Langue sémitique internationale"},
            {"code": "hindi", "name": "हिन्दी", "name_fr": "Hindi", "region": "Inde", "family": "Indo-aryen", "status": "coming_soon", "color": "#FF6F00", "flag_emoji": "🇮🇳", "total_lessons": 0, "description": "Langue officielle de l'Inde"},
            {"code": "chinois", "name": "中文", "name_fr": "Chinois (Mandarin)", "region": "Chine", "family": "Sino-tibétain", "status": "active", "color": "#C62828", "flag_emoji": "🇨🇳", "total_lessons": 20, "description": "Langue la plus parlée au monde"},
            {"code": "japonais", "name": "日本語", "name_fr": "Japonais", "region": "Japon", "family": "Japono-ryukyu", "status": "active", "color": "#AD1457", "flag_emoji": "🇯🇵", "total_lessons": 20, "description": "Langue du Japon"},
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
