import logging
from typing import Dict, Any, Optional, List
from .task_allocator import TaskAllocator
from .priority_manager import PriorityManager
from .fallback_handler import FallbackHandler
from .learning_module import LearningModule
from services.agent_manager.performance.decision_cache import DecisionCache

logger = logging.getLogger(__name__)

class DecisionEngine:
    """
    The core decision-making unit of the Agent Manager.
    It orchestrates task processing, allocation, and failure handling,
    now with caching for performance.
    """
    def __init__(self):
        self.task_allocator = TaskAllocator()
        self.priority_manager = PriorityManager()
        self.fallback_handler = FallbackHandler()
        self.learning_module = LearningModule()
        self.decision_cache = DecisionCache()
        logger.info("DecisionEngine initialized with all components, including DecisionCache.")

    async def decide_next_action(self, project_state: Dict, available_tasks: List[Dict]) -> Optional[Dict]:
        """
        Analyzes the current state and decides the next task to dispatch.
        It now uses caching to speed up agent allocation for recurring task types.
        """
        if not available_tasks:
            return None

        # 1. Prioritize available tasks
        prioritized_tasks = sorted(
            available_tasks,
            key=lambda t: self.priority_manager.calculate_priority(t),
            reverse=True
        )
        highest_priority_task = prioritized_tasks[0]

        # 2. Allocate the highest priority task to an agent, using cache if possible.
        if "agent" not in highest_priority_task or not highest_priority_task["agent"]:
            task_desc = highest_priority_task.get("description", "")

            # Check for a cached agent allocation decision
            cached_decision = await self.decision_cache.get_cached_decision(task_desc)
            if cached_decision and "agent" in cached_decision:
                selected_agent = cached_decision["agent"]
                logger.info(f"Using cached agent allocation for task '{task_desc[:50]}...': Agent '{selected_agent}'")
            else:
                # If not cached, select an agent and cache the decision
                selected_agent = self.task_allocator.select_agent(highest_priority_task)
                if selected_agent:
                    logger.info(f"Allocating new agent for task '{task_desc[:50]}...': Agent '{selected_agent}'")
                    await self.decision_cache.cache_decision(task_desc, {"agent": selected_agent})

            if not selected_agent:
                logger.error(f"Could not allocate an agent for task: {task_desc}")
                return None
            highest_priority_task["agent"] = selected_agent

        logger.info(f"Decision: Dispatching task '{highest_priority_task.get('description', '')[:50]}...' to agent '{highest_priority_task['agent']}'.")
        return highest_priority_task

    def process_task_failure(self, failed_task: Dict, error_info: Dict) -> Optional[Dict]:
        """
        Processes a task failure and decides on a fallback action.

        Args:
            failed_task: The task that failed.
            error_info: Details about the failure.

        Returns:
            A new task for remediation, or None.
        """
        # 1. Log the failure for learning
        self.learning_module.process_feedback({
            "agent_name": error_info.get("source_agent"),
            "status": "failure",
            "task": failed_task
        })

        # 2. Get a fallback action from the handler
        fallback_task = self.fallback_handler.handle_failure(failed_task, error_info)

        return fallback_task

    def process_task_success(self, completed_task: Dict, source_agent: str):
        """
        Processes a successful task completion for learning purposes.
        """
        self.learning_module.process_feedback({
            "agent_name": source_agent,
            "status": "success",
            "task": completed_task
        })
        logger.info(f"Processed successful completion of task by '{source_agent}'.")
