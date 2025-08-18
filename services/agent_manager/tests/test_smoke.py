import pytest
from fastapi.testclient import TestClient

from services.agent_manager.app.main import app

client = TestClient(app)

def test_health_check():
    """
    Tests if the /health endpoint returns a 200 OK status and correct JSON.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
