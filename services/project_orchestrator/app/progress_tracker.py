import logging
from typing import Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class ProgressTracker:
    """
    Tracks the detailed progress of complex projects, including task timings.
    """
    def __init__(self):
        self.projects: Dict[str, Dict] = {}
        logger.info("ProgressTracker initialized.")

    def start_tracking(self, project_id: str, workflow: Dict[str, Any]):
        """
        Initializes tracking for a new project.
        """
        plan = workflow.get("execution_plan", [])
        self.projects[project_id] = {
            "start_time": datetime.utcnow(),
            "status": "in_progress",
            "total_tasks": len(plan),
            "tasks": {task['task_id']: {"status": "pending", "start_time": None, "end_time": None} for task in plan}
        }
        logger.info(f"Started tracking project '{project_id}'.")

    def mark_task_started(self, project_id: str, task_id: str):
        """Marks a task as started and records the start time."""
        if project_id in self.projects and task_id in self.projects[project_id]["tasks"]:
            self.projects[project_id]["tasks"][task_id]["status"] = "in_progress"
            self.projects[project_id]["tasks"][task_id]["start_time"] = datetime.utcnow()
            logger.info(f"Project '{project_id}', Task '{task_id}': Marked as started.")

    def mark_task_completed(self, project_id: str, task_id: str):
        """Marks a task as completed and records the end time."""
        if project_id in self.projects and task_id in self.projects[project_id]["tasks"]:
            self.projects[project_id]["tasks"][task_id]["status"] = "completed"
            self.projects[project_id]["tasks"][task_id]["end_time"] = datetime.utcnow()
            logger.info(f"Project '{project_id}', Task '{task_id}': Marked as completed.")

    def generate_report(self, project_id: str) -> str:
        """
        Generates a detailed progress report for a project in Markdown format.
        """
        project = self.projects.get(project_id)
        if not project:
            return f"# Progress Report for {project_id}\n\nProject not found."

        completed_tasks = [t for t in project["tasks"].values() if t["status"] == "completed"]
        in_progress_tasks = [t for t in project["tasks"].values() if t["status"] == "in_progress"]

        progress_percent = (len(completed_tasks) / project["total_tasks"]) * 100 if project["total_tasks"] > 0 else 0

        elapsed_time = datetime.utcnow() - project["start_time"]

        report = f"# Progress Report for: {project_id}\n\n"
        report += f"- **Status**: {project['status']}\n"
        report += f"- **Progress**: {progress_percent:.2f}% ({len(completed_tasks)} / {project['total_tasks']} tasks completed)\n"
        report += f"- **Elapsed Time**: {str(elapsed_time).split('.')[0]}\n"

        report += "\n## Task Details\n\n"
        for task_id, details in project["tasks"].items():
            duration = ""
            if details["start_time"] and details["end_time"]:
                duration = f" (Duration: {str(details['end_time'] - details['start_time']).split('.')[0]})"
            report += f"- **Task {task_id}**: {details['status']}{duration}\n"

        return report
