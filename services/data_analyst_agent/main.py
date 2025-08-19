import asyncio
import logging
from agent import DataAnalystAgent

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    """
    Main entry point for running the DataAnalystAgent as a standalone service.
    This initializes the agent and keeps the process alive to listen for tasks.
    """
    logger.info("Initializing Data Analyst Agent...")
    # In a real scenario, the agent_id might come from an environment variable or a config service
    agent = DataAnalystAgent(agent_id="data_analyst_01")
    await agent.initialize()
    logger.info("Data Analyst Agent is running and listening for tasks.")

    # Keep the main coroutine alive indefinitely
    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Data Analyst Agent is shutting down.")
