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
        "source": "qa_agent",
        "event": event,
        "data": data,
        "timestamp": time.time()
    }
    redis_client.publish("memory_log_events", json.dumps(log_entry))

def redis_subscriber():
    """Listens for tasks on its dedicated Redis channel."""
    channel_name = "qa_agent_tasks"
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

            # --- Start of enhanced QA logic ---
            import ast

            context_artifacts = task_data.get('context_artifacts', [])
            source_code_artifacts = [a for a in context_artifacts if a.get('type') == 'source_code']

            report = {"files_analyzed": 0, "total_functions": 0, "total_classes": 0, "files": {}}

            for artifact in source_code_artifacts:
                file_path = artifact.get('path')
                try:
                    with open(file_path, 'r') as f:
                        code = f.read()

                    tree = ast.parse(code)
                    functions = [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
                    classes = [node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]

                    report["files_analyzed"] += 1
                    report["total_functions"] += len(functions)
                    report["total_classes"] += len(classes)
                    report["files"][file_path] = {"functions": functions, "classes": classes}

                except FileNotFoundError:
                    report["files"][file_path] = {"error": "File not found."}
                except Exception as e:
                    report["files"][file_path] = {"error": f"Failed to parse file: {e}"}

            log_to_memory("artifact_generated", {"qa_report": report})
            # --- End of enhanced QA logic ---

            completion_message = {
                "task_id": task_id,
                "project_name": project_name,
                "status": "completed",
                "agent": "qa_agent",
                "details": f"Finished: {task_desc}",
                "artifacts": [
                    {
                        "type": "qa_report",
                        "report": report
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
