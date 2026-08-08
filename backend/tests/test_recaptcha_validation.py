import importlib
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.routers.auth import verify_recaptcha_token


def test_verify_recaptcha_token_requires_token_when_secret_configured(monkeypatch):
    auth_module = importlib.import_module("app.routers.auth")

    monkeypatch.setattr(auth_module, "RECAPTCHA_SECRET_KEY", "test-secret")

    with pytest.raises(HTTPException):
        verify_recaptcha_token(None, "login")
