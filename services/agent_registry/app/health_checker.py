import asyncio
import logging
from datetime import datetime, timedelta
from .registry import AgentRegistry

logger = logging.getLogger(__name__)

class HealthChecker:
    """
    Periodically checks the health of registered agents, including performance metrics.
    """
    def __init__(self, agent_registry: AgentRegistry, check_interval_seconds: int = 30, stale_threshold_seconds: int = 90, high_load_threshold: float = 0.85):
        self.agent_registry = agent_registry
        self.check_interval = check_interval_seconds
        self.stale_threshold = timedelta(seconds=stale_threshold_seconds)
        self.high_load_threshold = high_load_threshold
        self._task = None

    async def start(self):
        """Starts the health checking loop."""
        if self._task is None:
            self._task = asyncio.create_task(self._run())
            logger.info("HealthChecker started.")

    async def stop(self):
        """Stops the health checking loop."""
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            logger.info("HealthChecker stopped.")

    async def _run(self):
        """The main loop that periodically checks agent health."""
        while True:
            try:
                await asyncio.sleep(self.check_interval)
                logger.info("Running health check...")
                self.check_agents() # This is not async, so no await needed
            except asyncio.CancelledError:
                logger.info("Health check loop cancelled.")
                break
            except Exception as e:
                logger.error(f"An error occurred in the health check loop: {e}", exc_info=True)

    def check_agents(self):
        """
        Iterates through agents, marking them as 'inactive' if their heartbeat is stale
        or 'overloaded' if their reported CPU usage is too high.
        """
        agents = self.agent_registry.list_agents()
        now = datetime.utcnow()

        for agent in agents:
            # Check for stale heartbeats
            if agent.last_heartbeat and (now - agent.last_heartbeat > self.stale_threshold):
                if agent.status != "inactive":
                    logger.warning(f"Agent '{agent.name}' is stale. Marking as inactive.")
                    self.agent_registry.set_agent_status(agent.name, "inactive")
                continue # Don't process other checks if stale

            # Check for high load on active agents
            if agent.status == "active":
                cpu_load = agent.performance_metrics.avg_response_time # Re-using this field for cpu_load
                if cpu_load and cpu_load > self.high_load_threshold:
                    logger.warning(f"Agent '{agent.name}' is under high load ({cpu_load}). Marking as overloaded.")
                    self.agent_registry.set_agent_status(agent.name, "overloaded")

            # If an agent is registered but has no heartbeat, mark it inactive
            elif not agent.last_heartbeat and agent.status != "inactive":
                self.agent_registry.set_agent_status(agent.name, "inactive")
