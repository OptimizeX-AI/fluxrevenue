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

def log_to_memory(event: str, data: dict):
    """Formats an event and publishes it to the memory log channel."""
    log_entry = {
        "source": "database_architect",
        "event": event,
        "data": data,
        "timestamp": time.time()
    }
    redis_client.publish("memory_log_events", json.dumps(log_entry))

def redis_subscriber():
    """Listens for tasks on its dedicated Redis channel."""
    channel_name = "database_architect_tasks"
    pubsub = redis_client.pubsub()
    pubsub.subscribe(channel_name)
    print(f"Subscribed to '{channel_name}'. Waiting for tasks...")

    for message in pubsub.listen():
        if message['type'] == 'message':
            task_data = json.loads(message['data'])
            log_to_memory("task_received", task_data)

            task_id = task_data.get('task_id')
            project_name = task_data.get('project_name', 'Unknown Project')

            log_to_memory("task_started", task_data)

            # --- Start of enhanced DDL generation ---
            requirements = task_data.get('requirements', '')

            # Simple entity extraction
            possible_entities = ["user", "product", "order", "item", "customer"]
            found_entities = [entity for entity in possible_entities if entity in requirements.lower()]
            if not found_entities:
                found_entities.append("item") # Default entity

            ddl_script = f"-- Auto-generated DDL for project: {project_name}\n\n"

            for entity in found_entities:
                table_name = f"{entity}s" # pluralize
                pk_name = f"{entity}_id"
                ddl_script += f"CREATE TABLE {table_name} (\n"
                ddl_script += f"    {pk_name} SERIAL PRIMARY KEY,\n"
                ddl_script += f"    name VARCHAR(100) NOT NULL,\n"
                ddl_script += f"    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n"
                ddl_script += ");\n\n"

            log_to_memory("artifact_generated", {"ddl_script": ddl_script})
            # --- End of enhanced DDL generation ---

            completion_message = {
                "task_id": task_id,
                "project_name": project_name,
                "status": "completed",
                "agent": "database_architect",
                "details": "Finished: Design Database Schema",
                "artifacts": [{"type": "ddl_script", "content": ddl_script}]
            }

            log_to_memory("task_finished", completion_message)
            redis_client.publish("manager_notifications", json.dumps(completion_message))

@app.on_event("startup")
def startup_event():
    """Starts the Redis subscriber in a background thread."""
    thread = threading.Thread(target=redis_subscriber, daemon=True)
    thread.start()

@app.get("/health")
def read_health():
    """Check the health of the service."""
    return {"status": "ok"}
