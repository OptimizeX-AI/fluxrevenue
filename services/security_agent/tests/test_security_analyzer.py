import pytest
import sys
import os
import shutil

from services.security_agent.app.security_analyzer import analyze_code_for_vulnerabilities
from services.security_agent.app.core.exceptions import ArtifactError

# Define a temporary workspace for these tests
TEST_WORKSPACE_DIR = "workspace_test_security"

@pytest.fixture(scope="function")
def cleanup_workspace():
    """A fixture to ensure the test workspace is clean before and after a test."""
    if os.path.exists(TEST_WORKSPACE_DIR):
        shutil.rmtree(TEST_WORKSPACE_DIR)
    os.makedirs(TEST_WORKSPACE_DIR, exist_ok=True)
    yield
    if os.path.exists(TEST_WORKSPACE_DIR):
        shutil.rmtree(TEST_WORKSPACE_DIR)

def create_test_file(content: str) -> str:
    """Helper function to create a temporary file with given content."""
    source_path = os.path.join(TEST_WORKSPACE_DIR, "test_sec_code.py")
    with open(source_path, "w") as f:
        f.write(content)
    return source_path

def test_analyzer_finds_hardcoded_password(cleanup_workspace):
    """Tests that a hardcoded password is detected."""
    code = "config['password'] = 'password123'"
    test_file = create_test_file(code)
    report = analyze_code_for_vulnerabilities(test_file)
    assert report["vulnerabilities_found"] == 1
    assert report["details"][0]["type"] == "hardcoded_password"

def test_analyzer_finds_use_of_eval(cleanup_workspace):
    """Tests that use of eval() is detected."""
    code = "result = eval(user_input)"
    test_file = create_test_file(code)
    report = analyze_code_for_vulnerabilities(test_file)
    assert report["vulnerabilities_found"] == 1
    assert report["details"][0]["type"] == "use_of_eval"

def test_analyzer_finds_insecure_debug_mode(cleanup_workspace):
    """Tests that insecure debug mode is detected."""
    code = "app.run(debug = True)"
    test_file = create_test_file(code)
    report = analyze_code_for_vulnerabilities(test_file)
    assert report["vulnerabilities_found"] == 1
    assert report["details"][0]["type"] == "insecure_debug_mode"

def test_analyzer_finds_hardcoded_secret_key(cleanup_workspace):
    """Tests that a hardcoded secret key is detected."""
    code = "app.config['SECRET_KEY'] = 'my-super-secret-key'"
    test_file = create_test_file(code)
    report = analyze_code_for_vulnerabilities(test_file)
    assert report["vulnerabilities_found"] == 1
    assert report["details"][0]["type"] == "hardcoded_secret_key"

def test_analyzer_passes_clean_code(cleanup_workspace):
    """Tests that clean code passes with no vulnerabilities found."""
    code = "def my_function(a, b):\\n    return a + b"
    test_file = create_test_file(code)
    report = analyze_code_for_vulnerabilities(test_file)
    assert report["vulnerabilities_found"] == 0
    assert len(report["details"]) == 0

def test_analyzer_handles_missing_file(cleanup_workspace):
    """Tests that an error is raised for a non-existent file."""
    with pytest.raises(ArtifactError):
        analyze_code_for_vulnerabilities("non_existent_file.py")
