import os
import redis
import threading
import json
import time
from fastapi import FastAPI

app = FastAPI()

# Connect to Redis
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_client = redis.Redis(host=redis_host, port=redis_port, db=0)

def log_to_memory(event: str, data: dict):
    """Formats an event and publishes it to the memory log channel."""
    log_entry = {
        "source": "code_architect",
        "event": event,
        "data": data,
        "timestamp": time.time()
    }
    redis_client.publish("memory_log_events", json.dumps(log_entry))

def redis_subscriber():
    """Listens for tasks on its dedicated Redis channel."""
    channel_name = "code_architect_tasks"
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

            # --- Start of enhanced logic ---
            requirements = task_data.get('requirements', '')

            # Simple analysis of requirements
            summary = "This project will be built using the following principles:\n"
            if 'api' in requirements.lower():
                summary += "- A RESTful API will be provided.\n"
            if 'frontend' in requirements.lower():
                summary += "- A web-based frontend will be created.\n"
            if 'database' in requirements.lower():
                summary += "- A PostgreSQL database will be used for persistence.\n"

            readme_content = f"""
# Architecture Plan for: {project_name}

## Project Summary
Based on the initial requirements, the following architectural decisions have been made.

{summary}
"""
            # Create artifact
            WORKSPACE_DIR = "workspace"
            project_path = os.path.join(WORKSPACE_DIR, project_name.replace(" ", "_").lower())
            os.makedirs(project_path, exist_ok=True)

            readme_path = os.path.join(project_path, "README.md")
            with open(readme_path, "w") as f:
                f.write(readme_content)

            log_to_memory("artifact_generated", {"path": readme_path})
            # --- End of enhanced logic ---

            completion_message = {
                "task_id": task_id,
                "project_name": project_name,
                "status": "completed",
                "agent": "code_architect",
                "details": "Finished: Define Core Architecture",
                "artifacts": [
                    {
                        "type": "documentation",
                        "path": readme_path
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
