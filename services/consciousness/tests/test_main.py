from fastapi.testclient import TestClient
from services.consciousness.main import app


client = TestClient(app)

def test_health_check():
    """Tests the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_build_self_model_endpoint():
    """
    Tests the happy path for the /build-self-model endpoint.
    This is an integration test, but since the underlying components are
    placeholders, it mainly checks if the endpoint runs without errors.
    """
    # In a real scenario, you might mock the engine call to avoid side effects
    # but for this placeholder test, calling the actual endpoint is fine.
    response = client.post("/build-self-model")
    assert response.status_code == 200
    data = response.json()
    assert "structural" in data
    assert "functional" in data
    assert "behavioral" in data
    # This assertion depends on the placeholder data, which makes the test brittle
    # but is okay for this audit-fixing stage.
    assert data["structural"]["services"] == ['agent_manager', 'nlp_engine']

def test_reflect_on_action_endpoint():
    """
    Tests the happy path for the /reflect-on-action endpoint.
    """
    request_body = {
        "action": {"action_id": "a1", "intention": "test"},
        "outcome": {"outcome_id": "o1", "result": "success"}
    }
    response = client.post("/reflect-on-action", json=request_body)
    assert response.status_code == 200
    data = response.json()
    assert "action" in data
    assert "outcome" in data
    assert "lessons" in data
    assert data["lessons"] == ['Lesson: The chosen strategy is effective.']

def test_reflect_on_action_invalid_input():
    """
    Tests the /reflect-on-action endpoint with invalid (malformed) input.
    FastAPI and Pydantic should automatically return a 422 Unprocessable Entity error.
    """
    request_body = {
        "action": {"action_id": "a1"}, # 'intention' field is missing
        "outcome": {"outcome_id": "o1", "result": "success"}
    }
    response = client.post("/reflect-on-action", json=request_body)
    assert response.status_code == 422
