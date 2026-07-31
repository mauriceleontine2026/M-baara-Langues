from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import health, auth, lessons, progress, audio, ai, languages, vocabulary, contributions, users, leaderboard
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="M'baara API", version="0.1.0")

Base.metadata.create_all(bind=engine)

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
static_dir = os.path.join(os.path.dirname(__file__), '..', 'static')
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")
