import pytest
from fastapi import HTTPException
from ..auth.auth_manager import AuthManager
import time

@pytest.fixture
def auth_manager():
    return AuthManager()

@pytest.fixture
def user_data():
    return {"id": "test_user", "username": "test"}

def test_generate_and_verify_token_successfully(auth_manager, user_data):
    """
    Test that a token can be generated and verified successfully.
    """
    token = auth_manager.generate_token(user_data)
    assert token is not an None

    payload = auth_manager.verify_token(token)
    assert payload["user_id"] == user_data["id"]
    assert payload["username"] == user_data["username"]

def test_verify_expired_token_raises_exception(auth_manager, user_data):
    """
    Test that verifying an expired token raises an HTTPException.
    """
    # Temporarily override the __init__ to create a token that expires immediately
    auth_manager_expired = AuthManager()
    original_init = auth_manager_expired.__init__
    def new_init(self):
        self.jwt_secret = "super-secret-key-for-dev"
    auth_manager_expired.__init__ = new_init

    # Monkeypatch generate_token to create an instantly expired token
    original_generate = auth_manager_expired.generate_token
    def expired_token_generator(user_data):
        import jwt
        from datetime import datetime, timedelta
        payload = {
            "user_id": user_data["id"],
            "username": user_data["username"],
            "exp": datetime.utcnow() - timedelta(seconds=1) # Expired 1 second ago
        }
        return jwt.encode(payload, auth_manager_expired.jwt_secret, algorithm="HS256")

    auth_manager_expired.generate_token = expired_token_generator

    expired_token = auth_manager_expired.generate_token(user_data)

    with pytest.raises(HTTPException) as exc_info:
        auth_manager_expired.verify_token(expired_token)

    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()

    # Restore original methods
    auth_manager_expired.__init__ = original_init
    auth_manager_expired.generate_token = original_generate


def test_verify_invalid_token_raises_exception(auth_manager):
    """
    Test that verifying an invalid token raises an HTTPException.
    """
    invalid_token = "this.is.not.a.valid.token"
    with pytest.raises(HTTPException) as exc_info:
        auth_manager.verify_token(invalid_token)

    assert exc_info.value.status_code == 401
    assert "invalid token" in exc_info.value.detail.lower()

def test_generate_token_missing_data_raises_exception(auth_manager):
    """
    Test that generating a token with missing user data raises an exception.
    """
    with pytest.raises(HTTPException) as exc_info:
        auth_manager.generate_token({"id": "test_user"}) # Missing username

    assert exc_info.value.status_code == 400
    assert "are required" in exc_info.value.detail.lower()
