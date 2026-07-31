#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
cd backend
pip3 install -r requirements.txt
python3 -m uvicorn app.main:app --host=0.0.0.0 --port "${PORT:-8000}"
