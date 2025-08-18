import pytest
import sys
import os
import shutil
import json

from services.code_architect.app.architecture_generator import generate_architecture_document, WORKSPACE_DIR

@pytest.fixture(scope="function")
def cleanup_workspace():
    """A fixture to ensure the workspace directory is clean before and after a test."""
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR)
    yield
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR)

def test_generate_architecture_document_creates_correct_file_and_content(cleanup_workspace):
    """
    Tests the generation of the architecture.json file, ensuring it is created
    in the correct location and contains the exact decisions provided.
    """
    project_name = "Arch Test Project"
    decisions = {
        "primary_language": "python",
        "backend_framework": "fastapi",
        "database_type": "postgresql",
        "frontend_framework": "react"
    }

    generated_file_path = generate_architecture_document(project_name, decisions)

    # 1. Assert file creation at the correct path
    expected_path = os.path.join(WORKSPACE_DIR, "arch_test_project", "architecture.json")
    assert generated_file_path == expected_path
    assert os.path.exists(generated_file_path)

    # 2. Assert the JSON content of the file matches the input decisions
    with open(generated_file_path, "r") as f:
        content = json.load(f)

    assert content == decisions

def test_generator_handles_empty_decisions(cleanup_workspace):
    """
    Tests that the generator can handle an empty decisions dictionary
    and create a valid, empty JSON object file.
    """
    project_name = "Empty Arch Project"
    decisions = {}

    generated_file_path = generate_architecture_document(project_name, decisions)

    assert os.path.exists(generated_file_path)

    with open(generated_file_path, "r") as f:
        content = json.load(f)

    assert content == {}
