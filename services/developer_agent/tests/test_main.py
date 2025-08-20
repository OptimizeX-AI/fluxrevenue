from fastapi.testclient import TestClient
from unittest.mock import patch

# Patch the dependencies that are initialized or called during the app's lifespan
# to prevent real connections, threads, or side effects during testing.
with patch('services.developer_agent.app.main.RabbitMQClient'), \
     patch('threading.Thread') as mock_thread:
    from services.developer_agent.app.main import app

client = TestClient(app)

def test_health_check():
    """
    Tests that the /health endpoint is available and returns a success status.
    This also implicitly tests that the application can initialize without errors.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
