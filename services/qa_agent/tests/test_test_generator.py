import pytest
import sys
import os
import shutil

from services.qa_agent.app.test_generator import generate_pytest_file, WORKSPACE_DIR
from services.qa_agent.app.core.exceptions import ArtifactError

@pytest.fixture(scope="function")
def cleanup_workspace():
    """A fixture to ensure the workspace directory is clean before and after a test."""
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR)
    yield
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR)

@pytest.fixture
def sample_source_code_artifact(cleanup_workspace):
    """Creates a dummy source code file for testing and returns its path."""
    project_name = "qa_test_project"
    # The source code would be in the project's root in a real scenario
    source_dir = os.path.join(WORKSPACE_DIR, project_name)
    os.makedirs(source_dir, exist_ok=True)
    source_path = os.path.join(source_dir, "main_app.py")

    code = """
from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/items/")
def create_item(item: dict):
    return item
"""
    with open(source_path, "w") as f:
        f.write(code)

    return project_name, source_path

def test_test_generator_creates_file_with_correct_content(sample_source_code_artifact):
    """
    Tests that the test generator creates a valid pytest file with content
    that correctly reflects the endpoints found in the source code.
    """
    project_name, source_path = sample_source_code_artifact

    generated_file_path = generate_pytest_file(project_name, source_path)

    # 1. Assert file creation
    expected_dir = os.path.join(WORKSPACE_DIR, project_name, "tests")
    assert os.path.dirname(generated_file_path) == expected_dir
    assert os.path.basename(generated_file_path) == "test_main_app.py"
    assert os.path.exists(generated_file_path)

    # 2. Assert file content
    with open(generated_file_path, "r") as f:
        content = f.read()

    assert 'from fastapi.testclient import TestClient' in content
    # Check for sanitized function names
    assert 'def test_endpoint_():' in content  # For the "/" endpoint
    assert 'def test_endpoint_items():' in content # For the "/items/" endpoint
    # Check for placeholder assertion text
    assert 'assert True, "Placeholder test for endpoint: /"' in content
    assert 'assert True, "Placeholder test for endpoint: /items/"' in content

def test_test_generator_handles_missing_source_file(cleanup_workspace):
    """
    Tests that the generator raises an ArtifactError if the source file does not exist.
    """
    project_name = "project_with_missing_source"
    non_existent_path = os.path.join(WORKSPACE_DIR, project_name, "non_existent.py")

    with pytest.raises(ArtifactError) as excinfo:
        generate_pytest_file(project_name, non_existent_path)

    assert "Source code file not found" in str(excinfo.value)
