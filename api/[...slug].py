import os
import sys
from pathlib import Path

# Ensure the backend package is importable from the deployed function.
ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from backend.app.main import app

if __name__ == '__main__':
    import uvicorn

    port = int(os.environ.get('PORT', '8000'))
    uvicorn.run(app, host='0.0.0.0', port=port)
