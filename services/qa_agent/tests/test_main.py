from fastapi.testclient import TestClient
from unittest.mock import patch

# Patch dependencies that are initialized or called during the app's lifespan
with patch('services.qa_agent.app.main.RabbitMQClient'), \
     patch('threading.Thread'):
    from services.qa_agent.app.main import app

client = TestClient(app)

def test_health_check():
    """
    Tests that the /health endpoint is available and returns a success status.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
