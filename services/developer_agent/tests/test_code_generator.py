import pytest
import sys
import os
import shutil

from services.developer_agent.app.code_generator import generate_fastapi_endpoint, WORKSPACE_DIR

@pytest.fixture(scope="function")
def cleanup_workspace():
    """A fixture to ensure the workspace directory is clean before and after a test."""
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR)
    yield
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR)

def test_generate_fastapi_endpoint_file_creation_and_content(cleanup_workspace):
    """
    Tests the code generation for a simple FastAPI endpoint, checking both
    the file's existence and its content.
    """
    project_name = "Test Project"
    task_description = "Develop REST API endpoints for features: users"

    # 1. Call the function to generate the code
    generated_file_path = generate_fastapi_endpoint(project_name, task_description)

    # 2. Assert that the file was created at the expected path
    expected_dir = os.path.join(WORKSPACE_DIR, "test_project")
    expected_filename = "users_routes.py"
    assert os.path.dirname(generated_file_path) == expected_dir
    assert os.path.basename(generated_file_path) == expected_filename
    assert os.path.exists(generated_file_path)

    # 3. Read the file and assert its content is correct
    with open(generated_file_path, "r") as f:
        content = f.read()

    assert 'from fastapi import FastAPI' in content
    assert 'app = FastAPI()' in content
    assert '@app.get("/users")' in content
    assert 'def read_users():' in content
    assert 'return {"message": "Endpoint for users is active"}' in content

def test_code_generator_sanitizes_project_name(cleanup_workspace):
    """
    Tests that the project name is sanitized to create a valid directory name.
    """
    project_name = "Invalid Project Name!!"
    task_description = "Develop REST API endpoints for features: items"

    generated_file_path = generate_fastapi_endpoint(project_name, task_description)

    # Check that the directory created uses the sanitized name
    sanitized_name = project_name.replace(" ", "_").lower()
    expected_dir = os.path.join(WORKSPACE_DIR, sanitized_name)

    assert os.path.exists(expected_dir)
    assert os.path.dirname(generated_file_path) == expected_dir
