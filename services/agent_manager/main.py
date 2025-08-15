import os
import redis
import threading
import json
import time
from fastapi import FastAPI
from planning_model import BasicPlanner

app = FastAPI()

# Connect to Redis
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_client = redis.Redis(host=redis_host, port=redis_port, db=0)

# Instantiate the planner model
planner = BasicPlanner()

# In-memory database to store project states
projects_db = {}

def log_to_memory(event: str, data: dict):
    """Formats an event and publishes it to the memory log channel."""
    log_entry = {
        "source": "agent_manager",
        "event": event,
        "data": data,
        "timestamp": time.time()
    }
    redis_client.publish("memory_log_events", json.dumps(log_entry))
    print(f"Logged to memory: {event}") # For console visibility

def redis_subscriber():
    """Listens for messages on Redis channels and processes them."""
    pubsub = redis_client.pubsub()
    channels = ["project_tasks", "manager_notifications"]
    pubsub.subscribe(*channels)
    print(f"Subscribed to channels: {channels}. Listening for messages...")

    for message in pubsub.listen():
        if message['type'] != 'message':
            continue

        channel = message['channel'].decode('utf-8')
        data = message['data']

        if channel == "project_tasks":
            project_data = json.loads(data)
            project_name = project_data.get('name')

            if project_name in projects_db:
                log_to_memory("project_creation_ignored", {"project_name": project_name, "reason": "already_exists"})
                continue

            log_to_memory("project_creation_received", {"project_name": project_name, "requirements": project_data.get('requirements')})

            execution_plan = planner.generate_plan(project_data.get('requirements', ''))
            log_to_memory("plan_generated", {"project_name": project_name, "plan": execution_plan})

            projects_db[project_name] = {
                "requirements": project_data.get('requirements', ''),
                "plan": execution_plan,
                "current_task_index": 0,
                "status": "in_progress",
                "artifacts": []
            }
            log_to_memory("project_state_initialized", {"project_name": project_name})

            if execution_plan:
                task_to_dispatch = execution_plan[0]
                task_to_dispatch['project_name'] = project_name
                task_to_dispatch['requirements'] = project_data.get('requirements', '')
                agent_name = task_to_dispatch['agent']
                dispatch_channel_name = f"{agent_name}_tasks"
                redis_client.publish(dispatch_channel_name, json.dumps(task_to_dispatch))
                log_to_memory("task_dispatched", {"project_name": project_name, "task": task_to_dispatch})

        elif channel == "manager_notifications":
            notification_data = json.loads(data)
            log_to_memory("task_completion_notification_received", {"notification": notification_data})

            project_name_found = notification_data.get('project_name')

            if not project_name_found or project_name_found not in projects_db:
                log_to_memory("project_lookup_failed", {"reason": "Project not found in DB", "notification": notification_data})
                continue

            project = projects_db[project_name_found]
            completed_task_id = notification_data.get('task_id')
            current_task = project['plan'][project['current_task_index']]

            if current_task['task_id'] != completed_task_id:
                log_to_memory("task_mismatch_error", {"project_name": project_name_found, "expected_task_id": current_task['task_id'], "received_task_id": completed_task_id})
                continue

            if "artifacts" in notification_data and notification_data["artifacts"]:
                # Store artifacts in a structured way, keyed by task ID
                project.setdefault('artifacts', {})[completed_task_id] = notification_data["artifacts"]
                log_to_memory("artifact_stored", {"project_name": project_name_found, "task_id": completed_task_id, "artifacts": notification_data["artifacts"]})

            project['current_task_index'] += 1

            if project['current_task_index'] >= len(project['plan']):
                project['status'] = 'completed'
                log_to_memory("project_completed", {"project_name": project_name_found})
            else:
                next_task_to_dispatch = project['plan'][project['current_task_index']]
                next_task_to_dispatch['project_name'] = project_name_found

                # Add context for the next agent
                next_task_to_dispatch['requirements'] = project.get('requirements', '')

                # Flatten the artifact dictionary to a list for the next agent
                all_artifacts = [artifact for task_artifacts in project.get('artifacts', {}).values() for artifact in task_artifacts]
                next_task_to_dispatch['context_artifacts'] = all_artifacts

                agent_name = next_task_to_dispatch['agent']
                dispatch_channel_name = f"{agent_name}_tasks"
                redis_client.publish(dispatch_channel_name, json.dumps(next_task_to_dispatch))
                log_to_memory("task_dispatched", {"project_name": project_name_found, "task": next_task_to_dispatch})

@app.on_event("startup")
def startup_event():
    """
    Starts the Redis subscriber in a background thread when the app starts.
    """
    thread = threading.Thread(target=redis_subscriber, daemon=True)
    thread.start()

@app.get("/health")
def read_health():
    """Check the health of the service."""
    return {"status": "ok"}
