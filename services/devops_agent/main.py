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

def redis_subscriber():
    """Listens for tasks on its dedicated Redis channel."""
    channel_name = "devops_agent_tasks"
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
                "agent": "devops_agent",
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
