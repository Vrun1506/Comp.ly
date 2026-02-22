"""Symmetric encryption for storing GitHub tokens in Firestore."""
from cryptography.fernet import Fernet
from app.core.config import settings
import base64


def _get_fernet() -> Fernet:
    key = settings.encryption_key
    if not key:
        # Dev fallback – insecure, replace in production!
        key = Fernet.generate_key().decode()
    # Ensure key is bytes
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


def encrypt(plaintext: str) -> str:
    f = _get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    f = _get_fernet()
    return f.decrypt(ciphertext.encode()).decode()
