import os
import redis
import threading
import json
from datetime import datetime
from fastapi import FastAPI

app = FastAPI()
LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "project_memory.log")

# Connect to Redis
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_client = redis.Redis(host=redis_host, port=redis_port, db=0)

def write_to_log(message: str):
    """Appends a message with a timestamp to the log file."""
    os.makedirs(LOG_DIR, exist_ok=True) # Ensure log directory exists
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")

def redis_subscriber():
    """Listens for events and logs them."""
    channel_name = "memory_log_events"
    pubsub = redis_client.pubsub()
    pubsub.subscribe(channel_name)
    print(f"Subscribed to '{channel_name}'. Logging events to {LOG_FILE}...")

    for message in pubsub.listen():
        if message['type'] == 'message':
            log_message = message['data'].decode('utf-8')
            print(f"Logging event: {log_message}") # Also print to console for visibility
            write_to_log(log_message)

@app.on_event("startup")
def startup_event():
    """Starts the Redis subscriber in a background thread."""
    # Log that the memory agent is starting
    write_to_log("Memory Agent service started.")
    thread = threading.Thread(target=redis_subscriber, daemon=True)
    thread.start()

@app.get("/health")
def read_health():
    """Check the health of the service."""
    return {"status": "ok"}

@app.get("/memory")
def get_memory_log():
    """Retrieves the content of the memory log."""
    if not os.path.exists(LOG_FILE):
        return {"error": "Log file not found."}
    with open(LOG_FILE, "r") as f:
        return {"log_content": f.read()}
