import pytest
import os
from unittest.mock import patch, MagicMock, mock_open
from services.qa_agent.app.task_processor import process_qa_task, _find_source_code_artifact
from services.qa_agent.app.core.exceptions import TaskValidationError, ArtifactError

def test_find_source_code_artifact_success():
    """Tests the helper function to find the correct artifact in a list."""
    artifacts = [
        {"type": "documentation", "content": "..."},
        {"type": "source_code", "language": "python", "content": "def f(): pass"},
    ]
    code_artifact = _find_source_code_artifact(artifacts)
    assert code_artifact is not None
    assert code_artifact["type"] == "source_code"

def test_find_source_code_artifact_not_found():
    """Tests that the helper function returns None if no source code artifact is present."""
    artifacts = [{"type": "documentation", "content": "..."}]
    assert _find_source_code_artifact(artifacts) is None

@patch('services.qa_agent.app.task_processor.TestGeneratorFactory')
@patch('services.qa_agent.app.task_processor.os.makedirs')
@patch('builtins.open', new_callable=mock_open)
def test_process_qa_task_happy_path(mock_open_file, mock_makedirs, MockFactory):
    """Tests the main successful execution path of the task processor."""
    # Arrange: Setup mocks for the factory, generator, and RabbitMQ client
    mock_generator = MagicMock()
    mock_generator.generate.return_value = "def test_new(): assert True"
    MockFactory.return_value.get_generator.return_value = mock_generator

    mock_rabbitmq = MagicMock()
    mock_rabbitmq.publish_message = MagicMock()

    task_data = {
        "task_id": 123,
        "project_name": "My Test Project",
        "description": "Generate unit tests for the new feature.",
        "context_artifacts": [{"type": "source_code", "language": "python", "content": "def my_feature(): pass"}]
    }

    # Act
    process_qa_task(task_data, mock_rabbitmq)

    # Assert
    MockFactory.return_value.get_generator.assert_called_once_with("python", "unit")
    mock_generator.generate.assert_called_once()
    mock_makedirs.assert_called_once()
    mock_open_file.assert_called_once()
    mock_rabbitmq.publish_message.assert_called_once()

    # Check that the completion message reports success
    args, _ = mock_rabbitmq.publish_message.call_args
    message_payload = args[1]
    assert message_payload['payload']['status'] == 'completed'
    assert len(message_payload['payload']['artifacts']) == 1
    assert message_payload['payload']['artifacts'][0]['type'] == 'unit_test_suite'

def test_process_qa_task_sanitizes_project_name_for_security():
    """
    Tests that the project name is sanitized, preventing path traversal.
    """
    with patch('services.qa_agent.app.task_processor.TestGeneratorFactory'), \
         patch('services.qa_agent.app.task_processor.os.makedirs') as mock_makedirs, \
         patch('builtins.open', new_callable=mock_open):

        task_data = {
            "task_id": 456,
            "project_name": "../../../etc/passwd",
            "description": "Generate unit tests",
            "context_artifacts": [{"type": "source_code", "language": "python", "content": "..."}]
        }
        process_qa_task(task_data, MagicMock())

        # Assert that the path passed to makedirs was sanitized
        call_args, _ = mock_makedirs.call_args
        sanitized_path = call_args[0]
        # The key is that the final path is still inside the workspace.
        # We can check that it doesn't contain '..' and that it starts
        # with the workspace directory.
        assert ".." not in sanitized_path
        assert os.path.abspath(sanitized_path).startswith(os.path.abspath("workspace"))
        assert "etcpasswd" in sanitized_path

def test_process_qa_task_raises_error_on_empty_sanitized_name():
    """
    Tests that an error is raised if sanitization results in an empty project name.
    """
    task_data = {
        "task_id": 789,
        "project_name": "!@#$%^&*",
        "description": "Generate unit tests",
        "context_artifacts": [{"type": "source_code", "language": "python", "content": "..."}]
    }

    with pytest.raises(TaskValidationError) as excinfo:
        process_qa_task(task_data, MagicMock())

    assert "invalid or empty after sanitization" in str(excinfo.value)
