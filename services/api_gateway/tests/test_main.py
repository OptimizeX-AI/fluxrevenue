import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from services.api_gateway.main import app

# By patching the client objects here, before TestClient is ever called,
# we ensure that the lifespan event uses the mocks, not the real clients.

@patch('services.api_gateway.main.http_client', new_callable=AsyncMock)
@patch('services.api_gateway.main.rabbitmq_client')
def test_health_check(mock_rabbit, mock_http):
    """Test the health check endpoint."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@patch('services.api_gateway.main.http_client')
@patch('services.api_gateway.main.RabbitMQClient.create_message')
@patch('services.api_gateway.main.rabbitmq_client')
def test_create_project_endpoint(mock_rabbit_instance, mock_create_message, mock_http):
    """Test the project creation endpoint, ensuring it calls RabbitMQ."""
    # Configure the mock for the static method to return a predictable value
    test_message = {'target_agent': 'project_orchestrator', 'payload': {'name': 'test_project'}}
    mock_create_message.return_value = test_message

    client = TestClient(app)

    project_data = {"name": "test_project", "requirements": "test reqs", "tasks": []}
    response = client.post("/api/v1/projects", json=project_data)

    assert response.status_code == 200
    assert response.json()["project_name"] == "test_project"

    mock_create_message.assert_called_once()
    mock_rabbit_instance.publish_message.assert_called_once_with(
        "project_orchestration_tasks", test_message
    )

@patch('services.api_gateway.main.rabbitmq_client')
@patch('services.api_gateway.main.http_client.get', new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_get_project_report_endpoint(mock_get, mock_rabbit):
    """Test the project report endpoint, ensuring it proxies correctly."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "# Mocked Report"
    mock_response.raise_for_status = MagicMock()
    mock_get.return_value = mock_response

    client = TestClient(app)
    response = client.get("/api/v1/projects/123/report")

    assert response.status_code == 200
    assert response.text == "# Mocked Report"

    mock_get.assert_awaited_once_with("http://project_orchestrator:8011/api/v1/projects/123/report")
