import os
from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class AuthManager:
    def __init__(self):
        self.jwt_secret = os.getenv("JWT_SECRET", "super-secret-key-for-dev")

    def generate_token(self, user_data: dict) -> str:
        """
        Generates a JWT token for a user.
        """
        payload = {
            "user_id": user_data.get("id"),
            "username": user_data.get("username"),
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        if not payload["user_id"] or not payload["username"]:
            raise HTTPException(status_code=400, detail="User ID and username are required to generate a token.")

        return jwt.encode(payload, self.jwt_secret, algorithm="HS256")

    def verify_token(self, token: str) -> dict:
        """
        Verifies and decodes a JWT token.
        """
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency to get the current user from a token.
    """
    auth_manager = AuthManager()
    payload = auth_manager.verify_token(token)
    return payload
