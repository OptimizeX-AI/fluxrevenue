import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ResourceAllocator:
    """
    Manages the allocation and (simulated) scaling of agent resources.
    """
    def __init__(self):
        # In a real system, this would be discovered via the Agent Registry
        self.agent_pools = {
            "developer_agent": 1,
            "qa_agent": 1,
            "security_agent": 1
        }
        self.scaling_policies = {
            "max_instances": 5,
            "scale_up_threshold": 10, # Number of tasks in queue to trigger scale-up
        }
        logger.info("ResourceAllocator initialized.")

    def analyze_workload_and_scale(self, task_queues: Dict[str, int]):
        """
        Analyzes the current task queue depths and triggers scaling if needed.

        Args:
            task_queues: A dictionary mapping agent type (queue name) to queue depth.
                         e.g., {"developer_agent_tasks": 15}
        """
        logger.info(f"Analyzing workload: {task_queues}")
        for queue_name, depth in task_queues.items():
            agent_type = queue_name.replace("_tasks", "")
            if agent_type in self.agent_pools:
                current_instances = self.agent_pools[agent_type]
                if depth > (self.scaling_policies["scale_up_threshold"] * current_instances):
                    if current_instances < self.scaling_policies["max_instances"]:
                        self.scale_agents(agent_type, current_instances + 1)

    def scale_agents(self, agent_type: str, new_count: int) -> bool:
        """
        Simulates scaling agent instances up or down by logging the command
        that would be executed.
        """
        logger.warning(
            f"SCALING TRIGGERED for '{agent_type}'. "
            f"Simulating scaling from {self.agent_pools[agent_type]} to {new_count} instances."
        )

        # This is the command we would run in a real Docker Compose environment
        simulated_command = f"docker-compose up -d --scale {agent_type}={new_count} --no-recreate"

        logger.info(f"SIMULATED COMMAND: `{simulated_command}`")

        # Update our internal count to reflect the scaled state
        self.agent_pools[agent_type] = new_count

        return True
