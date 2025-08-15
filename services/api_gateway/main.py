import os
import redis
from fastapi import FastAPI
from pydantic import BaseModel

# Define the data model for a project
class Project(BaseModel):
    name: str
    requirements: str

app = FastAPI()

# Connect to Redis
# The Redis host is named 'redis' in docker-compose.yml
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_client = redis.Redis(host=redis_host, port=redis_port, db=0)


@app.get("/health")
def read_health():
    """Check the health of the service."""
    return {"status": "ok"}

@app.post("/api/v1/projects")
def create_project(project: Project):
    """
    Receives project requirements and publishes them to a Redis channel.
    """
    # Convert the project data to a string to publish it
    message = project.model_dump_json()

    # Publish the message to the 'project_tasks' channel
    redis_client.publish("project_tasks", message)

    return {"message": "Project received and queued for processing.", "project_name": project.name}
