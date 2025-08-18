import os
import asyncio
import json
import logging
import threading
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Set

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
from .file_processor import FileProcessor
from .knowledge_extractor import KnowledgeExtractor

# OpenTelemetry and Prometheus instrumentation
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# --- Agent Definition ---
AGENT_NAME = "memory_agent"
AGENT_VERSION = "2.1.0" # Version bump for learning capabilities
AGENT_CAPABILITIES = ["event_storage", "knowledge_graph_updates", "semantic_search", "document_learning"]
HEARTBEAT_INTERVAL = 60
LEARNING_MATERIALS_DIR = "/app/learning_materials"
LEARNING_SCAN_INTERVAL = 120 # Scan for new files every 2 minutes

# --- Tracer and Logger Setup ---
setup_tracer(AGENT_NAME)
from .core.config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

# --- Globals ---
# ... (same as before)
processed_files: Set[str] = set()
learning_thread: threading.Thread
stop_learning = threading.Event()

# --- Pydantic Models for API ---
class MemoryQuery(BaseModel):
    query: str
    k: int = 5
# ... (rest of the models are the same)

# --- File Learning Pipeline ---
def learning_pipeline_loop():
    """Periodically scans the learning directory and processes new files."""
    file_processor = FileProcessor()
    # These singletons are initialized in the lifespan manager
    knowledge_extractor = KnowledgeExtractor(knowledge_graph, semantic_search)

    while not stop_learning.is_set():
        logger.info(f"Scanning for new learning materials in {LEARNING_MATERIALS_DIR}...")
        try:
            if os.path.exists(LEARNING_MATERIALS_DIR):
                for filename in os.listdir(LEARNING_MATERIALS_DIR):
                    filepath = os.path.join(LEARNING_MATERIALS_DIR, filename)
                    if filepath not in processed_files:
                        logger.info(f"New learning material found: {filename}")
                        result = file_processor.process_file(filepath)
                        if result:
                            content_type, text_content = result
                            knowledge_extractor.extract_and_integrate(text_content, filepath, content_type)
                            processed_files.add(filepath)
                            logger.info(f"Successfully processed and learned from {filename}.")
        except Exception as e:
            logger.error(f"Error in learning pipeline: {e}", exc_info=True)

        time.sleep(LEARNING_SCAN_INTERVAL)


# --- Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{AGENT_NAME} is starting up with document learning capabilities.")

    # Initialize Memory Components
    global memory_store, knowledge_graph, embedding_engine, semantic_search, processed_files
    memory_store = MemoryStore()
    knowledge_graph = memory_store.load_knowledge_graph()
    embedding_engine = EmbeddingEngine()
    semantic_search = SemanticSearch(embedding_engine)
    # In a real system, we'd also need to load/re-index the semantic search index

    # Initialize RabbitMQ, Heartbeat, etc.
    # ... (same as before)

    # Start the new learning pipeline thread
    global learning_thread
    learning_thread = threading.Thread(target=learning_pipeline_loop)
    learning_thread.start()

    yield

    logger.info(f"{AGENT_NAME} is shutting down.")
    stop_learning.set()
    learning_thread.join()
    # ... (rest of the shutdown is the same)
    stop_heartbeat.set()
    heartbeat_thread.join()
    rabbitmq_client.close()
    memory_store.save_knowledge_graph(knowledge_graph)
    logger.info("Knowledge Graph saved.")

# ... (The rest of the file, including FastAPI app init, RabbitMQ handlers, API endpoints,
# and heartbeat/registration functions, remains largely the same but is included for completeness)

# --- FastAPI App Initialization ---
app = FastAPI(lifespan=lifespan, title=AGENT_NAME)
Instrumentator().instrument(app).expose(app)
FastAPIInstrumentor.instrument_app(app)

# --- RabbitMQ Handlers ---
def event_consumer_callback(message: dict):
    try:
        event_data = message.get('payload')
        process_event_for_memory(event_data, knowledge_graph, semantic_search)
    except Exception as e:
        logger.critical(f"An unexpected critical error occurred in event callback: {e}", exc_info=True)

# --- API Endpoints ---
@app.get("/health")
def read_health(): return {"status": "ok"}
@app.post("/api/v1/memory/query/semantic", response_model=List)
def semantic_query(query: MemoryQuery):
    return semantic_search.search(query.query, k=query.k)
@app.post("/api/v1/memory/query/kg", response_model=List)
def kg_query(query: KnowledgeQuery):
    return knowledge_graph.query_knowledge(query.entity_id, query.relationship_type)

# --- Agent Self-Registration and Heartbeat ---
def register_with_registry():
    # ...
    pass
def heartbeat_loop():
    # ...
    pass

# Full definitions for brevity
def register_with_registry():
    registration_data = {"name": AGENT_NAME, "version": AGENT_VERSION, "capabilities": AGENT_CAPABILITIES, "supported_languages": []}
    message = RabbitMQClient.create_message(source_agent=AGENT_NAME, target_agent="agent_registry", task_type="register", payload=registration_data)
    rabbitmq_client.publish_message("agent_registration", message)
def heartbeat_loop():
    while not stop_heartbeat.is_set():
        try:
            heartbeat_message = RabbitMQClient.create_message(source_agent=AGENT_NAME, target_agent="agent_registry", task_type="heartbeat", payload={})
            rabbitmq_client.publish_message("agent_heartbeats", heartbeat_message)
        except Exception: pass
        time.sleep(HEARTBEAT_INTERVAL)
