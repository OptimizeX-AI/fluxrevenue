import logging
import networkx as nx
from typing import List, Dict, Tuple, Any
from collections import defaultdict

from .conflict_resolver import ConflictResolver

logger = logging.getLogger(__name__)

class AdvancedDependencyManager:
    """
    Manages task dependencies, detects conflicts, and determines a valid execution order.
    """
    def __init__(self):
        self.graph = nx.DiGraph()
        self.conflict_resolver = ConflictResolver()
        logger.info("AdvancedDependencyManager initialized.")

    def build_graph(self, tasks: List[Dict]):
        """Builds a directed graph from a list of tasks and their dependencies."""
        self.graph.clear()
        task_ids = {task['task_id'] for task in tasks}

        for task in tasks:
            task_id = task['task_id']
            self.graph.add_node(task_id, **task)

            for dep_id in task.get('depends_on', []):
                if dep_id not in task_ids:
                    raise ValueError(f"Task {task_id} has an invalid dependency: {dep_id}")
                self.graph.add_edge(dep_id, task_id)

    def analyze_and_resolve(self, tasks: List[Dict]) -> List[Dict]:
        """
        The main entry point to build the graph, detect and resolve conflicts,
        and return a final, ordered execution plan.
        """
        self.build_graph(tasks)

        # Detect and resolve conflicts before finalizing the order
        self._detect_and_resolve_conflicts()

        # After resolution, calculate the final execution order
        execution_order, is_cyclic = self._resolve_task_order()
        if is_cyclic:
            raise ValueError("Cyclic dependency detected even after conflict resolution.")

        task_map = {task['task_id']: self.graph.nodes[task['task_id']] for task in tasks}
        ordered_plan = [task_map[task_id] for task_id in execution_order]
        return ordered_plan

    def _resolve_task_order(self) -> Tuple[List[str], bool]:
        """Resolves task execution order using a topological sort."""
        if not nx.is_directed_acyclic_graph(self.graph):
            cycles = list(nx.simple_cycles(self.graph))
            logger.error(f"Cyclic dependency detected in task graph. Cycles: {cycles}")
            return [], True

        execution_order = list(nx.topological_sort(self.graph))
        logger.info(f"Resolved execution order: {execution_order}")
        return execution_order, False

    def _detect_and_resolve_conflicts(self):
        """(Proof-of-Concept) Detects and resolves resource contention conflicts."""
        # This is a simplified simulation of conflict detection.
        # A real system would analyze resource usage (files, database tables, etc.)

        # Example: Find tasks that use the same exclusive resource.
        resource_usage = defaultdict(list)
        for task_id, task_data in self.graph.nodes(data=True):
            resource = task_data.get("exclusive_resource")
            if resource:
                resource_usage[resource].append(task_id)

        for resource, tasks in resource_usage.items():
            if len(tasks) > 1:
                # We have a conflict
                logger.warning(f"Resource contention detected for '{resource}' between tasks: {tasks}")
                conflict_details = {"tasks": tasks, "resource": resource}
                resolution = self.conflict_resolver.resolve("resource_contention", conflict_details)

                # Apply the resolution
                if resolution.get("action") == "add_dependency":
                    source = resolution["details"]["source_task"]
                    target = resolution["details"]["target_task"]
                    if not self.graph.has_edge(source, target) and not self.graph.has_edge(target, source):
                        self.graph.add_edge(source, target)
                        logger.info(f"Resolution applied: Added dependency {source} -> {target}")
