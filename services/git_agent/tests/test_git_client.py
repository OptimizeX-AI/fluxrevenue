import unittest
from unittest.mock import patch, MagicMock
import os
import sys

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.git_client import GitClient

class TestGitClient(unittest.TestCase):

    @patch('git.Repo.clone_from')
    def test_clone_repo(self, mock_clone_from):
        """Test that the clone_repo method calls the underlying git command."""
        # Arrange
        repo_url = "https://github.com/example/repo.git"
        local_path = "/tmp/test_repo"

        # Act
        client = GitClient(repo_url, local_path)

        # Assert
        mock_clone_from.assert_called_once_with(repo_url, local_path)
        self.assertIsNotNone(client.repo)

    @patch('git.Repo')
    def test_create_branch(self, MockRepo):
        """Test the creation of a new branch."""
        # Arrange
        # Mock the entire Repo object and its methods
        mock_repo_instance = MagicMock()
        MockRepo.return_value = mock_repo_instance

        # To avoid the _clone_or_open_repo call, we patch the Repo constructor
        # and then manually create the client instance
        with patch.object(GitClient, '_clone_or_open_repo', return_value=mock_repo_instance):
            client = GitClient("some_url", "some_path")

            # Act
            client.create_branch("new-feature-branch")

            # Assert
            # Check that a new head (branch) was created
            mock_repo_instance.create_head.assert_called_once_with("new-feature-branch")
            # Check that the new branch was checked out
            self.assertTrue(mock_repo_instance.create_head.return_value.checkout.called)

    @patch('git.Repo')
    def test_commit_changes(self, MockRepo):
        """Test adding and committing files."""
        # Arrange
        mock_repo_instance = MagicMock()
        mock_index = MagicMock()
        mock_repo_instance.index = mock_index

        with patch.object(GitClient, '_clone_or_open_repo', return_value=mock_repo_instance):
            client = GitClient("some_url", "some_path")

            # Act
            files_to_add = ["file1.py", "src/file2.py"]
            commit_message = "feat: Add new feature"
            client.add_files(files_to_add)
            client.commit_changes(commit_message)

            # Assert
            mock_index.add.assert_called_once_with(files_to_add)
            mock_index.commit.assert_called_once_with(commit_message)


if __name__ == '__main__':
    unittest.main()
