import logging
from typing import Dict, Any, List
from .dependency_manager import AdvancedDependencyManager

logger = logging.getLogger(__name__)

class WorkflowEngine:
    """
    The core engine for creating and managing project workflows.
    """
    def __init__(self):
        self.dependency_manager = AdvancedDependencyManager()
        logger.info("WorkflowEngine initialized with AdvancedDependencyManager.")

    def create_workflow(self, project_spec: Dict[str, Any]) -> Dict:
        """
        Creates a structured workflow from a project specification, now including
        git, build, and deploy steps automatically.
        """
        original_tasks = project_spec.get("tasks", [])
        repo_url = project_spec.get("repo_url")
        project_name = project_spec.get("name")
        language = project_spec.get("language", "python") # Assume python

        if not repo_url or not project_name:
            raise ValueError("Project specification must include 'name' and 'repo_url'.")

        # 1. Define standard CI/CD tasks
        clone_task = {
            "task_id": "setup_repository",
            "agent": "git_agent",
            "description": f"Clone repository from {repo_url}",
            "action": "clone", "repo_url": repo_url, "project_id": project_name
        }

        build_task = {
            "task_id": "build_project",
            "agent": "ci_cd_orchestrator",
            "description": "Build the project and create an artifact.",
            "action": "build", "language": language, "project_id": project_name,
            "repo_path": f"/app/workspace/{project_name}" # Path inside the container
        }

        deploy_task = {
            "task_id": "deploy_project",
            "agent": "devops_agent",
            "description": "Deploy the build artifact to a target environment.",
            "action": "deploy" # Placeholder
        }

        # 2. Wire up the dependencies
        # All original tasks depend on the clone task
        for task in original_tasks:
            task.setdefault("depends_on", []).append(clone_task["task_id"])

        # The build task depends on all original tasks
        build_task["depends_on"] = [t["task_id"] for t in original_tasks]

        # The deploy task depends on the build task
        deploy_task["depends_on"] = [build_task["task_id"]]

        all_tasks = [clone_task] + original_tasks + [build_task, deploy_task]

        # 3. Resolve dependencies for the full workflow
        ordered_plan = self.dependency_manager.analyze_and_resolve(all_tasks)

        workflow = {
            "project_name": project_name,
            "execution_plan": ordered_plan,
            "status": "pending"
        }

        logger.info(f"Created full CI/CD workflow for project '{project_name}'.")
        return workflow
