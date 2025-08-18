import pytest
from fastapi.testclient import TestClient
from ..main import app

client = TestClient(app)

@pytest.fixture
def auth_headers():
    # Get a valid token by logging in
    response = client.post("/api/token", data={"username": "jules", "password": "supersecret"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_read_root_serves_static_index(auth_headers):
    """
    Test that the root path serves the static index.html file.
    Because we use `StaticFiles(html=True)`, it should return the main page.
    """
    response = client.get("/", headers=auth_headers)
    assert response.status_code == 200
    assert "text/html" in response.headers['content-type']

def test_login_for_access_token_success():
    """
    Test successful authentication and token retrieval.
    """
    response = client.post("/api/token", data={"username": "jules", "password": "supersecret"})
    assert response.status_code == 200
    json_response = response.json()
    assert "access_token" in json_response
    assert json_response["token_type"] == "bearer"

def test_login_for_access_token_failure():
    """
    Test that authentication fails with incorrect credentials.
    """
    response = client.post("/api/token", data={"username": "jules", "password": "wrongpassword"})
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

def test_get_dashboard_overview_success(auth_headers):
    """
    Test successful retrieval of the dashboard overview with authentication.
    """
    response = client.get("/api/dashboard/overview", headers=auth_headers)
    assert response.status_code == 200
    json_response = response.json()
    assert "active_projects" in json_response
    assert "agent_status" in json_response
    assert "system_metrics" in json_response

def test_get_dashboard_overview_no_auth():
    """
    Test that accessing a protected endpoint without authentication fails.
    """
    response = client.get("/api/dashboard/overview")
    assert response.status_code == 401 # Because of the Depends(oauth2_scheme)
    assert "Not authenticated" in response.json()["detail"]

def test_get_project_timeline_success(auth_headers):
    """
    Test successful retrieval of a project's timeline with authentication.
    """
    project_id = "test_project"
    response = client.get(f"/api/projects/{project_id}/timeline", headers=auth_headers)
    assert response.status_code == 200
    json_response = response.json()
    assert json_response["project_id"] == project_id
    assert "timeline" in json_response

def test_get_users_me_success(auth_headers):
    """
    Test the /users/me endpoint to ensure it returns the current user's data.
    """
    response = client.get("/api/users/me", headers=auth_headers)
    assert response.status_code == 200
    json_response = response.json()
    assert json_response["username"] == "jules"
    assert "user_id" in json_response
