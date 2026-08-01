#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
cd backend
python3 -m pip install --no-cache-dir -r ../requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
