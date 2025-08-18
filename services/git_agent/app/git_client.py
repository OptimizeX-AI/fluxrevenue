import logging
import os
from git import Repo, GitCommandError

logger = logging.getLogger(__name__)

class GitClient:
    """
    A client for performing local Git operations using the GitPython library.
    """
    def __init__(self, repo_url: str, local_path: str):
        self.repo_url = repo_url
        self.local_path = local_path
        self.repo: Repo = self._clone_or_open_repo()

    def _clone_or_open_repo(self) -> Repo:
        """
        Clones the repository if it doesn't exist locally, otherwise opens it.
        """
        if os.path.exists(self.local_path):
            logger.info(f"Repository already exists at {self.local_path}. Opening it.")
            try:
                return Repo(self.local_path)
            except GitCommandError as e:
                logger.error(f"Failed to open existing repository: {e}")
                raise
        else:
            logger.info(f"Cloning repository from {self.repo_url} to {self.local_path}.")
            try:
                return Repo.clone_from(self.repo_url, self.local_path)
            except GitCommandError as e:
                logger.error(f"Failed to clone repository: {e}")
                raise

    def create_branch(self, branch_name: str, base_branch: str = 'main') -> bool:
        """
        Creates and checks out a new local branch from a base branch.
        """
        try:
            # Ensure the base branch is up-to-date
            self.repo.remotes.origin.pull(base_branch)

            new_branch = self.repo.create_head(branch_name)
            new_branch.checkout()
            logger.info(f"Created and checked out new branch: {branch_name}")
            return True
        except GitCommandError as e:
            logger.error(f"Failed to create branch '{branch_name}': {e}")
            return False

    def add_files(self, files: list):
        """
        Stages a list of files for the next commit.
        """
        try:
            self.repo.index.add(files)
            logger.info(f"Staged files: {files}")
        except GitCommandError as e:
            logger.error(f"Failed to stage files: {e}")
            raise

    def commit_changes(self, message: str) -> str:
        """
        Commits the staged changes.
        """
        try:
            commit = self.repo.index.commit(message)
            logger.info(f"Committed changes with message: '{message}'. Commit hash: {commit.hexsha}")
            return commit.hexsha
        except GitCommandError as e:
            logger.error(f"Failed to commit changes: {e}")
            raise

    def push_changes(self, branch_name: str) -> bool:
        """
        Pushes the current branch to the origin.
        """
        try:
            self.repo.remotes.origin.push(refspec=f'{branch_name}:{branch_name}')
            logger.info(f"Pushed branch '{branch_name}' to origin.")
            return True
        except GitCommandError as e:
            logger.error(f"Failed to push branch '{branch_name}': {e}")
            return False
