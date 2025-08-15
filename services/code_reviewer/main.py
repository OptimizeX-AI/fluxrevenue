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
        "source": "code_reviewer",
        "event": event,
        "data": data,
        "timestamp": time.time()
    }
    redis_client.publish("memory_log_events", json.dumps(log_entry))

def redis_subscriber():
    """Listens for tasks on its dedicated Redis channel."""
    channel_name = "code_reviewer_tasks"
    pubsub = redis_client.pubsub()
    pubsub.subscribe(channel_name)
    print(f"Subscribed to '{channel_name}'. Waiting for tasks...")

    for message in pubsub.listen():
        if message['type'] == 'message':
            task_data = json.loads(message['data'])
            log_to_memory("task_received", task_data)

            task_id = task_data.get('task_id')
            task_desc = task_data.get('description')
            project_name = task_data.get('project_name', 'Unknown Project')

            log_to_memory("task_started", task_data)

            # --- Start of enhanced review logic ---
            review_status = "rejected"
            review_comments = "Could not perform review. Missing artifacts."

            context_artifacts = task_data.get('context_artifacts', [])
            source_code_artifacts = [a for a in context_artifacts if a.get('type') == 'source_code']
            doc_artifact = next((a for a in context_artifacts if a.get('type') == 'documentation'), None)

            if source_code_artifacts and doc_artifact:
                try:
                    # Read documentation
                    with open(doc_artifact.get('path'), 'r') as f:
                        readme_content = f.read().lower()

                    # Read source code
                    code_content = ""
                    for code_artifact in source_code_artifacts:
                        with open(code_artifact.get('path'), 'r') as f:
                            code_content += f.read().lower()

                    # Contextual Review: Check if code reflects architecture
                    checks_passed = True
                    comments = []
                    if "api" in readme_content and "fastapi" not in code_content:
                        checks_passed = False
                        comments.append("README mentions API, but 'FastAPI' not found in code.")
                    if "database" in readme_content and "pydantic" not in code_content:
                        checks_passed = False
                        comments.append("README mentions database, but 'Pydantic' models not found.")

                    if checks_passed:
                        review_status = "approved"
                        review_comments = "Code is consistent with architectural plan."
                    else:
                        review_comments = "Inconsistencies found: " + " ".join(comments)

                except FileNotFoundError as e:
                    review_comments = f"Could not find file for review: {e.filename}"
                except Exception as e:
                    review_comments = f"An error occurred during review: {e}"

            # --- End of enhanced review logic ---

            completion_message = {
                "task_id": task_id,
                "project_name": project_name,
                "status": "completed",
                "agent": "code_reviewer",
                "details": f"Finished: {task_desc}",
                "artifacts": [
                    {
                        "type": "review_result",
                        "status": review_status,
                        "comments": review_comments
                    }
                ]
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
