import os
import asyncio
import json
import logging
import threading
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

# Add parent directory to path to import shared services
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from message_broker.rabbitmq_client import RabbitMQClient
from tracing import setup_tracer

# Local memory components
from .knowledge_graph import KnowledgeGraph
from .embedding_engine import EmbeddingEngine
from .semantic_search import SemanticSearch
from .memory_store import MemoryStore
from .memory_processor import process_event_for_memory

# OpenTelemetry and Prometheus instrumentation
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# --- Agent Definition ---
AGENT_NAME = "memory_agent"
AGENT_VERSION = "2.0.0" # Version bump for new capabilities
AGENT_CAPABILITIES = ["event_storage", "knowledge_graph_updates", "semantic_search"]
AGENT_SUPPORTED_LANGUAGES = []
HEARTBEAT_INTERVAL = 60

# --- Tracer and Logger Setup ---
setup_tracer(AGENT_NAME)
from services.memory_agent.app.core.config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

# --- Globals ---
rabbitmq_client: RabbitMQClient
heartbeat_thread: threading.Thread
stop_heartbeat = threading.Event()
memory_store: MemoryStore
knowledge_graph: KnowledgeGraph
embedding_engine: EmbeddingEngine
semantic_search: SemanticSearch

# --- Pydantic Models for API ---
class MemoryQuery(BaseModel):
    query: str
    k: int = 5

class KnowledgeQuery(BaseModel):
    entity_id: str
    relationship_type: str = None

# --- Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{AGENT_NAME} is starting up.")

    # Initialize Memory Components
    global memory_store, knowledge_graph, embedding_engine, semantic_search
    memory_store = MemoryStore()
    knowledge_graph = memory_store.load_knowledge_graph()
    embedding_engine = EmbeddingEngine()
    semantic_search = SemanticSearch(embedding_engine)
    # In a real system, we'd need to re-index documents on startup

    # Initialize RabbitMQ
    global rabbitmq_client, heartbeat_thread
    rabbitmq_client = RabbitMQClient(
        host=os.getenv("RABBITMQ_HOST", "localhost"),
        username=os.getenv("RABBITMQ_DEFAULT_USER", "user"),
        password=os.getenv("RABBITMQ_DEFAULT_PASS", "password")
    )
    rabbitmq_client.connect()

    # Register, start heartbeat, and start consuming events
    register_with_registry()
    heartbeat_thread = threading.Thread(target=heartbeat_loop)
    heartbeat_thread.start()
    consumer_thread = threading.Thread(target=lambda: rabbitmq_client.consume_messages("memory_events", event_consumer_callback))
    consumer_thread.start()

    yield

    logger.info(f"{AGENT_NAME} is shutting down.")
    stop_heartbeat.set()
    heartbeat_thread.join()
    rabbitmq_client.close()
    memory_store.save_knowledge_graph(knowledge_graph) # Persist KG on shutdown
    logger.info("Knowledge Graph saved.")

# --- FastAPI App Initialization ---
app = FastAPI(lifespan=lifespan, title=AGENT_NAME)
Instrumentator().instrument(app).expose(app)
FastAPIInstrumentor.instrument_app(app)

# --- RabbitMQ Handlers ---
def event_consumer_callback(message: dict):
    """Callback to process events and update memory components."""
    try:
        event_data = message.get('payload')
        logger.info("Received new event for memory.", extra={"props": {"event_type": event_data.get("event_type")}})
        process_event_for_memory(event_data, knowledge_graph, semantic_search)
    except Exception as e:
        logger.critical(f"An unexpected critical error occurred in event callback: {e}", exc_info=True)

# --- Agent Self-Registration and Heartbeat ---
def register_with_registry():
    # ... (code is the same as other agents)
    pass
def heartbeat_loop():
    # ... (code is the same as other agents)
    pass

# --- API Endpoints ---
@app.get("/health")
def read_health():
    return {"status": "ok"}

@app.post("/api/v1/memory/query/semantic", response_model=List)
def semantic_query(query: MemoryQuery):
    """Performs a semantic search on the memory index."""
    try:
        return semantic_search.search(query.query, k=query.k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/memory/query/kg", response_model=List)
def kg_query(query: KnowledgeQuery):
    """Queries the knowledge graph for relationships."""
    try:
        return knowledge_graph.query_knowledge(query.entity_id, query.relationship_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Note: The heartbeat and registration functions are identical to other agents
# and are omitted here for brevity, but they exist in the full file.
def register_with_registry():
    registration_data = {"name": AGENT_NAME, "version": AGENT_VERSION, "capabilities": AGENT_CAPABILITIES, "supported_languages": AGENT_SUPPORTED_LANGUAGES}
    message = RabbitMQClient.create_message(source_agent=AGENT_NAME, target_agent="agent_registry", task_type="register", payload=registration_data)
    rabbitmq_client.publish_message("agent_registration", message)
    logger.info(f"Sent registration request for {AGENT_NAME}.")

def heartbeat_loop():
    while not stop_heartbeat.is_set():
        try:
            heartbeat_message = RabbitMQClient.create_message(source_agent=AGENT_NAME, target_agent="agent_registry", task_type="heartbeat", payload={})
            rabbitmq_client.publish_message("agent_heartbeats", heartbeat_message)
            logger.debug(f"Sent heartbeat from {AGENT_NAME}.")
        except Exception as e:
            logger.error(f"Failed to send heartbeat: {e}", exc_info=True)
        time.sleep(HEARTBEAT_INTERVAL)
