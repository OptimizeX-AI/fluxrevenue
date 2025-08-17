import os
import redis.asyncio as redis
import asyncio
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from services.memory_agent.app.core.config import setup_logging
from services.memory_agent.app.core.exceptions import BaseAgentException
from services.memory_agent.app.models import Base
from services.memory_agent.app.memory_processor import process_event

# Setup structured logging
setup_logging()
logger = logging.getLogger(__name__)

# --- Database Setup ---
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = (
    f"postgresql+asyncpg://{os.getenv('POSTGRES_USER', 'jules')}:{os.getenv('POSTGRES_PASSWORD', 'jules')}@"
    f"{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/{os.getenv('POSTGRES_DB', 'jules_db')}_memory"
)
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager to handle startup and shutdown events."""
    logger.info("Memory Agent is starting up.")
    await init_db()
    logger.info("Memory database initialized.")
    subscriber_task = asyncio.create_task(async_redis_subscriber())
    yield
    logger.info("Memory Agent is shutting down.")
    subscriber_task.cancel()
    try:
        await subscriber_task
    except asyncio.CancelledError:
        logger.info("Redis subscriber task cancelled successfully.")

app = FastAPI(lifespan=lifespan)
redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=int(os.getenv("REDIS_PORT", 6379)), db=0)

async def async_redis_subscriber():
    """Listens for events on the 'memory_events' channel."""
    channel_name = "memory_events"
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

            event_data = json.loads(message['data'])
            logger.info("Received new event for memory.", extra={"props": {"event_type": event_data.get("event_type")}})

            async with AsyncSessionLocal() as session:
                await process_event(event_data, session)

        except json.JSONDecodeError:
            logger.error("Failed to decode JSON from Redis message.", extra={"props": {"raw_message": message.get('data', '')}})
        except BaseAgentException as e:
             logger.warning(f"A handled business logic error occurred: {e.message}", extra={"props": {"exception_type": type(e).__name__}})
        except Exception:
            logger.critical("An unexpected critical error occurred in subscriber loop.", exc_info=True)
            await asyncio.sleep(5)

@app.get("/health")
def read_health():
    """Health check endpoint for the Memory Agent."""
    return {"status": "ok"}
