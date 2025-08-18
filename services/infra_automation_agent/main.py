import asyncio
import logging
from agent import InfraAutomationAgent

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    """
    Main entry point for running the InfraAutomationAgent as a standalone service.
    """
    logger.info("Initializing Infrastructure Automation Agent...")
    agent = InfraAutomationAgent(agent_id="infra_automation_01")
    await agent.initialize()
    logger.info("Infrastructure Automation Agent is running and listening for tasks.")

    # Keep the main coroutine alive indefinitely
    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Infrastructure Automation Agent is shutting down.")
