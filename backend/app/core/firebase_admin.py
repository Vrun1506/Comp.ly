"""Firebase Admin SDK initialisation (singleton)."""
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth
from app.core.config import settings

_app: firebase_admin.App | None = None


def get_firebase_app() -> firebase_admin.App:
    global _app
    if _app is not None:
        return _app

    sa_path = settings.firebase_service_account_json
    if sa_path and os.path.exists(sa_path):
        cred = credentials.Certificate(sa_path)
    else:
        # Build from individual env vars (useful for cloud deployment)
        cred = credentials.Certificate(
            {
                "type": "service_account",
                "project_id": settings.firebase_project_id,
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", ""),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL", ""),
                "client_id": os.getenv("FIREBASE_CLIENT_ID", ""),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )

    _app = firebase_admin.initialize_app(cred)
    return _app


def get_db() -> firestore.Client:
    get_firebase_app()
    return firestore.client()


def verify_id_token(id_token: str) -> dict:
    get_firebase_app()
    return auth.verify_id_token(id_token)
