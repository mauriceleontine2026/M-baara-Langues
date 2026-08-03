from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / 'backend'
sys.path.insert(0, str(BACKEND))

import app.database as dbmod

print('DATABASE_URL=', getattr(dbmod, 'DATABASE_URL', None))
print('DEFAULT_DB_PATH=', getattr(dbmod, 'DEFAULT_DB_PATH', None))
print('Engine=', getattr(dbmod, 'engine', None))
