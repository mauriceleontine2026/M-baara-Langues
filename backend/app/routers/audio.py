from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from pydantic import BaseModel
import tempfile
import os
import uuid
from pathlib import Path

router = APIRouter()

STATIC_DIR = Path(os.environ.get("MBAARA_STATIC_DIR", "/tmp/mbaara/static"))
if os.access(Path(__file__).resolve().parents[2], os.W_OK):
    STATIC_DIR = Path(__file__).resolve().parents[1] / "static"
UPLOAD_DIR = STATIC_DIR / "audio"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class SynthesizeRequest(BaseModel):
    text: str
    language_code: str | None = None

# Optional faster-whisper model (lazy-loaded)
_whisper_model = None
_whisper_available = False
try:
    from faster_whisper import WhisperModel
    _whisper_available = True
except Exception:
    _whisper_available = False


def get_whisper_model():
    global _whisper_model
    if not _whisper_available:
        return None
    if _whisper_model is None:
        # default to a small CPU-friendly model; users can change to larger models
        _whisper_model = WhisperModel("small", device="cpu")
    return _whisper_model


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    if not _whisper_available:
        raise HTTPException(status_code=501, detail="faster-whisper not installed on server. Install faster-whisper and models to enable local STT.")

    model = get_whisper_model()
    if model is None:
        raise HTTPException(status_code=500, detail="Failed to initialize Whisper model")

    # save upload to a temp file
    suffix = Path(file.filename).suffix or ".wav"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        contents = await file.read()
        tmp.write(contents)
        tmp.flush()
        tmp.close()

        segments, info = model.transcribe(tmp.name, beam_size=5)
        text = "".join([s.text for s in segments]) if segments else ""
        return {"text": text, "language": info.language if hasattr(info, 'language') else None, "confidence": None}
    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass


@router.post("/synthesize")
async def synthesize_audio(payload: SynthesizeRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="No text provided")

    # Try to use gTTS if available to create an mp3 that can be served
    try:
        from gtts import gTTS
        out_dir = Path(__file__).resolve().parents[1] / "static" / "audio"
        out_dir.mkdir(parents=True, exist_ok=True)
        fname = f"tts_{uuid.uuid4().hex}.mp3"
        out_path = out_dir / fname
        tts = gTTS(text=payload.text, lang=(payload.language_code or "fr"))
        tts.save(str(out_path))
        audio_url = f"/static/audio/{fname}"
        return {"audio_url": audio_url, "text": payload.text, "language_code": payload.language_code or "fr", "duration_seconds": None}
    except Exception:
        # Fallback: suggest client-side synthesis via Expo
        return {"audio_url": None, "text": payload.text, "language_code": payload.language_code or "fr", "duration_seconds": None, "note": "gTTS unavailable; client should use local TTS (expo-speech)"}


@router.post("/upload")
async def upload_audio(request: Request, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    suffix = Path(file.filename).suffix or ".bin"
    filename = f"upload_{uuid.uuid4().hex}{suffix}"
    save_path = UPLOAD_DIR / filename

    try:
        contents = await file.read()
        save_path.write_bytes(contents)
        base_url = request.url_for("static", path=f"audio/{filename}")
        return {"file_url": str(base_url)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}")
