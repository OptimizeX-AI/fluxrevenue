import asyncio
import logging
from datetime import datetime, timedelta
from .registry import AgentRegistry

logger = logging.getLogger(__name__)

class HealthChecker:
    """
    Periodically checks the health of registered agents.
    """
    def __init__(self, agent_registry: AgentRegistry, check_interval_seconds: int = 60, stale_threshold_seconds: int = 180):
        self.agent_registry = agent_registry
        self.check_interval = check_interval_seconds
        self.stale_threshold = timedelta(seconds=stale_threshold_seconds)
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
                await self.check_agents()
            except asyncio.CancelledError:
                logger.info("Health check loop cancelled.")
                break
            except Exception as e:
                logger.error(f"An error occurred in the health check loop: {e}", exc_info=True)

    async def check_agents(self):
        """
        Iterates through agents and marks them as inactive if their heartbeat is stale.
        """
        agents = self.agent_registry.list_agents()
        now = datetime.utcnow()

        for agent in agents:
            if agent.status == "active" and agent.last_heartbeat:
                if now - agent.last_heartbeat > self.stale_threshold:
                    logger.warning(f"Agent '{agent.name}' is stale. Marking as inactive.")
                    self.agent_registry.set_agent_status(agent.name, "inactive")
            elif not agent.last_heartbeat:
                # If an agent is somehow registered without a heartbeat, mark it inactive.
                self.agent_registry.set_agent_status(agent.name, "inactive")
