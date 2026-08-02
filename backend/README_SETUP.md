# Backend Setup (FastAPI + PostgreSQL)

## Prérequis
- Python 3.10+
- Docker et Docker Compose (fortement recommandé)
- ffmpeg installé pour audio local

## Installation

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Configuration

1. Copier `.env.example` en `.env` :

```powershell
copy .env.example .env
```

2. Si vous utilisez Docker, démarrez PostgreSQL :

```powershell
docker compose up -d
```

3. Vérifiez la variable `DATABASE_URL` dans `.env`.

## Lancer l'API

```powershell
uvicorn backend.app.main:app --reload
```

## Notes audio

- `faster-whisper` gère la transcription locale.
- `gTTS` génère un MP3 serveur si installé.
- `expo-speech` est utilisé côté mobile pour TTS local.

## Commande de test

```powershell
curl http://127.0.0.1:8000/api/health
```
