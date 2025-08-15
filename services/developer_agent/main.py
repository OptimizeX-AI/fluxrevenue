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
        "source": "developer_agent",
        "event": event,
        "data": data,
        "timestamp": time.time()
    }
    redis_client.publish("memory_log_events", json.dumps(log_entry))

def redis_subscriber():
    """Listens for tasks on its dedicated Redis channel."""
    channel_name = "developer_agent_tasks"
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

            # --- Start of enhanced code generation logic ---
            requirements = task_data.get('requirements', '')

            # Simple entity extraction
            possible_entities = ["user", "product", "order", "item", "customer"]
            found_entities = [entity for entity in possible_entities if entity in requirements.lower()]

            # Define project structure
            WORKSPACE_DIR = "workspace"
            project_path = os.path.join(WORKSPACE_DIR, project_name.replace(" ", "_").lower())
            src_path = os.path.join(project_path, "src")
            os.makedirs(src_path, exist_ok=True)

            # Generate models.py
            models_path = os.path.join(src_path, "models.py")
            models_code = "from pydantic import BaseModel\n\n"
            if not found_entities:
                found_entities.append("item") # Default entity

            for entity in found_entities:
                models_code += f"class {entity.capitalize()}(BaseModel):\n"
                models_code += f"    {entity}_id: int\n"
                models_code += f"    name: str\n\n"

            with open(models_path, "w") as f:
                f.write(models_code)

            # Generate main.py
            main_path = os.path.join(src_path, "main.py")
            main_code = "from fastapi import FastAPI\n"
            main_code += "from .models import " + ", ".join([e.capitalize() for e in found_entities]) + "\n\n"
            main_code += "app = FastAPI()\n\n"
            main_code += "@app.get('/')\n"
            main_code += "def read_root():\n"
            main_code += f"    return {{'message': 'Welcome to {project_name}'}}\n"

            with open(main_path, "w") as f:
                f.write(main_code)

            generated_files = [models_path, main_path]
            log_to_memory("artifacts_generated", {"paths": generated_files})
            # --- End of enhanced logic ---

            completion_message = {
                "task_id": task_id,
                "project_name": project_name,
                "status": "completed",
                "agent": "developer_agent",
                "details": f"Finished: {task_desc}",
                "artifacts": [{"type": "source_code", "path": path} for path in generated_files]
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
