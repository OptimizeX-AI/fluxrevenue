import asyncio
import logging
from agent import SupportSpecialistAgent

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    """
    Main entry point for running the SupportSpecialistAgent as a standalone service.
    """
    logger.info("Initializing Support Specialist Agent...")
    agent = SupportSpecialistAgent(agent_id="support_specialist_01")
    await agent.initialize()
    logger.info("Support Specialist Agent is running and listening for tasks.")

    # Keep the main coroutine alive indefinitely
    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Support Specialist Agent is shutting down.")
