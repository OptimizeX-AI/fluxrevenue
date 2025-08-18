import os
import redis.asyncio as redis
import asyncio
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from services.qa_agent.app.core.config import setup_logging
from services.qa_agent.app.core.exceptions import BaseAgentException
from services.qa_agent.app.task_processor import process_qa_task

# Setup structured logging
setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager to handle startup and shutdown events."""
    logger.info("QA Agent is starting up.")
    subscriber_task = asyncio.create_task(async_redis_subscriber())
    yield
    logger.info("QA Agent is shutting down.")
    subscriber_task.cancel()
    try:
        await subscriber_task
    except asyncio.CancelledError:
        logger.info("Redis subscriber task cancelled successfully.")

app = FastAPI(lifespan=lifespan)
redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=int(os.getenv("REDIS_PORT", 6379)), db=0)

async def async_redis_subscriber():
    """Listens for tasks on the 'qa_agent_tasks' channel."""
    channel_name = "qa_agent_tasks"
    logger.info("Starting Redis subscriber...", extra={"props": {"channel": channel_name}})

    pubsub = redis_client.pubsub()
    await pubsub.subscribe(channel_name)
    logger.info("Subscribed to Redis channel.", extra={"props": {"channel": channel_name}})

    while True:
        try:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if not message:
                await asyncio.sleep(0.01)
                continue

            task_data = json.loads(message['data'])
            logger.info("Received new QA task.", extra={"props": {"task_id": task_data.get("task_id")}})

            await process_qa_task(task_data, redis_client)

        except json.JSONDecodeError:
            logger.error("Failed to decode JSON from Redis message.", extra={"props": {"raw_message": message.get('data', '')}})
        except BaseAgentException as e:
             logger.warning(f"A handled business logic error occurred: {e.message}", extra={"props": {"exception_type": type(e).__name__}})
        except Exception:
            logger.critical("An unexpected critical error occurred in subscriber loop.", exc_info=True)
            await asyncio.sleep(5)

@app.get("/health")
def read_health():
    """Health check endpoint for the QA Agent."""
    return {"status": "ok"}
