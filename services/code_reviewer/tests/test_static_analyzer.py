import pytest
import sys
import os
import shutil

from services.code_reviewer.app.static_analyzer import analyze_code
from services.code_reviewer.app.core.exceptions import CodeAnalysisError

# Define a temporary workspace for these tests
TEST_WORKSPACE_DIR = "workspace_test_reviewer"

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
    source_path = os.path.join(TEST_WORKSPACE_DIR, "test_code.py")
    with open(source_path, "w") as f:
        f.write(content)
    return source_path

def test_analyzer_flags_long_function(cleanup_workspace):
    """Tests that a function with more than 20 lines is correctly flagged."""
    long_func_body = "\n".join([f"    a = {i}" for i in range(21)])
    code = f"""def long_function():
    \"\"\"This is a docstring.\"\"\"
{long_func_body}
"""

    test_file = create_test_file(code)
    report = analyze_code(test_file)

    assert len(report["issues"]) == 1
    assert "is too long (22 lines)" in report["issues"][0]
    assert report["overall_score"] == 0.9

def test_analyzer_flags_missing_docstring(cleanup_workspace):
    """Tests that a function without a docstring is correctly flagged."""
    code = """def function_without_docstring():
    pass
"""

    test_file = create_test_file(code)
    report = analyze_code(test_file)

    assert len(report["issues"]) == 1
    assert "is missing a docstring" in report["issues"][0]
    assert report["overall_score"] == 0.95

def test_analyzer_flags_multiple_issues(cleanup_workspace):
    """Tests that multiple issues are flagged and the score is cumulative."""
    long_func_body = "\n".join([f"    a = {i}" for i in range(21)])
    code = f"""def long_function_no_doc():
{long_func_body}
"""

    test_file = create_test_file(code)
    report = analyze_code(test_file)

    assert len(report["issues"]) == 2
    assert any("is too long" in issue for issue in report["issues"])
    assert any("is missing a docstring" in issue for issue in report["issues"])
    assert report["overall_score"] == 0.85

def test_analyzer_passes_good_code(cleanup_workspace):
    """Tests that well-formed code passes the analysis with a perfect score."""
    code = """def good_function():
    \"\"\"This is a good docstring.\"\"\"
    a = 1
    return a
"""

    test_file = create_test_file(code)
    report = analyze_code(test_file)

    assert len(report["issues"]) == 0
    assert report["overall_score"] == 1.0

def test_analyzer_handles_non_existent_file(cleanup_workspace):
    """Tests that the analyzer raises an error for a file that does not exist."""
    with pytest.raises(CodeAnalysisError) as excinfo:
        analyze_code("non_existent_file.py")

    assert "Source file not found" in str(excinfo.value)
