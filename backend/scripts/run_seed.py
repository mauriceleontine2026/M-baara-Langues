import sys
import os
from pathlib import Path

# Ensure backend package is importable when running from repo root
ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

# Force DATABASE_URL to use the local sqlite DB in the workspace so seeding targets it
os.environ["DATABASE_URL"] = f"sqlite:///{ROOT / 'mbaara.db'}"

from app.main import _seed_dictionary_content
from app.database import SessionLocal

if __name__ == '__main__':
    db = SessionLocal()
    try:
        _seed_dictionary_content(db)
        print('Seeding completed')
    finally:
        db.close()
