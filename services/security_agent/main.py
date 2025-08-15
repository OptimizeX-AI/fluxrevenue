import os
import redis
import threading
import json
import time
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from qdrant_client import QdrantClient

app = FastAPI()

# Connect to Redis
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_client = redis.Redis(host=redis_host, port=redis_port, db=0)

# Database Connections
# PostgreSQL
DATABASE_URL = (
    f"postgresql+asyncpg://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@"
    f"{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
)
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Qdrant
qdrant_client = QdrantClient(host=os.getenv("QDRANT_HOST"), port=os.getenv("QDRANT_PORT"))

def redis_subscriber():
    """Listens for tasks on its dedicated Redis channel."""
    channel_name = "security_agent_tasks"
    pubsub = redis_client.pubsub()
    pubsub.subscribe(channel_name)
    print(f"Subscribed to '{channel_name}'. Waiting for tasks...")

    for message in pubsub.listen():
        if message['type'] == 'message':
            task_data = json.loads(message['data'])
            task_id = task_data.get('task_id')
            task_desc = task_data.get('description')

            print(f"--- Received Task {task_id}: '{task_desc}' ---")

            # Placeholder for actual work
            print("Processing task...")
            time.sleep(5) # Simulate work
            print("Task processing finished.")

            # Notify the manager that the task is complete
            completion_message = {
                "task_id": task_id,
                "status": "completed",
                "agent": "security_agent",
                "details": f"Finished: {task_desc}"
            }
            redis_client.publish("manager_notifications", json.dumps(completion_message))
            print(f"--- Published completion notification for Task {task_id} ---")

@app.on_event("startup")
def startup_event():
    """Starts the Redis subscriber in a background thread."""
    thread = threading.Thread(target=redis_subscriber, daemon=True)
    thread.start()

@app.get("/health")
def read_health():
    """Check the health of the service."""
    return {"status": "ok"}
