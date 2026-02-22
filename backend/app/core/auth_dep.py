"""FastAPI dependency: verify Firebase ID token and inject uid + consultancyId."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.firebase_admin import verify_id_token, get_db

bearer_scheme = HTTPBearer()


class CurrentUser:
    def __init__(self, uid: str, consultancy_id: str | None):
        self.uid = uid
        self.consultancy_id = consultancy_id


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    token = credentials.credentials
    try:
        decoded = verify_id_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token",
        )

    uid = decoded["uid"]

    # Look up consultancyId from Firestore user doc
    db = get_db()
    user_doc = db.collection("users").document(uid).get()
    consultancy_id: str | None = None
    if user_doc.exists:
        consultancy_id = user_doc.to_dict().get("consultancyId")

    return CurrentUser(uid=uid, consultancy_id=consultancy_id)


def require_consultancy(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Use this dependency when the endpoint requires an established consultancy."""
    if not user.consultancy_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to a consultancy yet.",
        )
    return user
