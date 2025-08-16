import pytest
import sys
import os
import shutil
import zipfile

from services.devops_agent.app.packager import create_project_archive, WORKSPACE_DIR

@pytest.fixture(scope="function")
def cleanup_workspace():
    """A fixture to ensure the workspace directory is clean before and after a test."""
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR)
    yield
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR)

@pytest.fixture
def sample_artifacts(cleanup_workspace):
    """Creates a dummy project with a couple of artifact files."""
    project_name = "zip_test_project"
    # The artifact paths would be absolute paths in the real system
    project_path = os.path.join(WORKSPACE_DIR, project_name)
    os.makedirs(project_path, exist_ok=True)

    file1_path = os.path.join(project_path, "main.py")
    file2_path = os.path.join(project_path, "models.py")

    with open(file1_path, "w") as f:
        f.write("print('hello world')")
    with open(file2_path, "w") as f:
        f.write("class User: pass")

    return project_name, [file1_path, file2_path]

def test_create_project_archive_creates_zip_and_has_correct_content(sample_artifacts):
    """
    Tests that the packager correctly creates a zip archive with the specified files
    and that the contents are correct.
    """
    project_name, artifact_paths = sample_artifacts

    archive_path = create_project_archive(project_name, artifact_paths)

    # 1. Assert that the archive file was created
    assert os.path.exists(archive_path)

    # 2. Assert the contents of the archive
    with zipfile.ZipFile(archive_path, 'r') as zipf:
        # Check that the file names inside the zip are correct and have relative paths
        zipped_files = zipf.namelist()
        expected_arcname1 = os.path.join(project_name, "main.py")
        expected_arcname2 = os.path.join(project_name, "models.py")

        assert expected_arcname1 in zipped_files
        assert expected_arcname2 in zipped_files

        # Check the content of one of the files
        with zipf.open(expected_arcname1) as f:
            content = f.read().decode('utf-8')
            assert "print('hello world')" in content

        with zipf.open(expected_arcname2) as f:
            content = f.read().decode('utf-8')
            assert "class User: pass" in content

def test_create_archive_with_no_files(cleanup_workspace):
    """
    Tests that the function can correctly handle an empty list of files,
    creating an empty zip archive.
    """
    project_name = "empty_project"
    artifact_paths = []

    archive_path = create_project_archive(project_name, artifact_paths)

    assert os.path.exists(archive_path)

    with zipfile.ZipFile(archive_path, 'r') as zipf:
        assert len(zipf.namelist()) == 0
