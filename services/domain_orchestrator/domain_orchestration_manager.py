from typing import Dict, List, Any
from collections import deque
from .models import MultiDomainProject, ProjectResult, Task
from .cross_domain_coordinator import CrossDomainCoordinator

# --- Mock placeholder classes for internal components ---
# (These would be in a separate `clients` module in a real system)
class MockAgentRegistryClient:
    async def find_agents_for_domain(self, domain: str) -> List[str]:
        return [f"{domain}_agent_01"]

class MockTaskScheduler:
    async def execute_plan(self, plan: List[Task]) -> Dict:
        print("--- Executing Cross-Domain Plan ---")
        for task in plan:
            print(f"  - Dispatching task '{task.task_id}' ({task.description}) to domain '{task.domain}'")
        return {"final_status": "All tasks dispatched successfully."}

# --- Helper function for planning ---
def topological_sort(tasks: List[Task]) -> List[Task]:
    """
    Sorts tasks based on their dependencies using a topological sort algorithm.
    Returns a list of tasks in a valid execution order.
    Raises an exception if a cycle is detected.
    """
    in_degree = {task.task_id: 0 for task in tasks}
    adj_list = {task.task_id: [] for task in tasks}
    task_map = {task.task_id: task for task in tasks}

    for task in tasks:
        for dep in task.dependencies:
            adj_list[dep].append(task.task_id)
            in_degree[task.task_id] += 1

    queue = deque([task_id for task_id, degree in in_degree.items() if degree == 0])
    sorted_tasks = []

    while queue:
        task_id = queue.popleft()
        sorted_tasks.append(task_map[task_id])

        for neighbor_id in adj_list[task_id]:
            in_degree[neighbor_id] -= 1
            if in_degree[neighbor_id] == 0:
                queue.append(neighbor_id)

    if len(sorted_tasks) != len(tasks):
        raise ValueError("A cyclic dependency was detected in the project tasks.")

    return sorted_tasks

# --- Domain Orchestration Manager ---
class DomainOrchestrationManager:
    def __init__(self):
        self.agent_registry = MockAgentRegistryClient()
        self.task_scheduler = MockTaskScheduler()
        self.cross_domain_coordinator = CrossDomainCoordinator()

    async def _analyze_domain_requirements(self, project: MultiDomainProject) -> Dict[str, List[Task]]:
        domain_map = {}
        for task in project.tasks:
            desc = task.description.lower()
            if not task.domain: # Infer domain if not provided
                if "provision" in desc or "server" in desc:
                    task.domain = "infrastructure_automation"
                elif "analyze" in desc or "dataset" in desc:
                    task.domain = "data_analysis"
                elif "ticket" in desc or "issue" in desc:
                    task.domain = "technical_support"
                else:
                    task.domain = "general"

            if task.domain not in domain_map:
                domain_map[task.domain] = []
            domain_map[task.domain].append(task)
        return domain_map

    async def _create_cross_domain_execution_plan(self, project: MultiDomainProject) -> List[Task]:
        """Creates a valid execution plan by topologically sorting the tasks."""
        return topological_sort(project.tasks)

    async def orchestrate_multi_domain_project(self, project: MultiDomainProject) -> ProjectResult:
        domain_requirements = await self._analyze_domain_requirements(project)

        required_agents = {
            domain: await self.agent_registry.find_agents_for_domain(domain)
            for domain in domain_requirements
        }

        await self.cross_domain_coordinator.coordinate_domains(domain_requirements)

        execution_plan = await self._create_cross_domain_execution_plan(project)

        result_data = await self.task_scheduler.execute_plan(execution_plan)

        return ProjectResult(
            project_id=project.project_id,
            status="completed",
            results=result_data
        )
