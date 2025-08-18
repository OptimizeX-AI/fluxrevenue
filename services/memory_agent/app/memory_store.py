import json
import logging
import os
from typing import Dict
from .knowledge_graph import KnowledgeGraph

logger = logging.getLogger(__name__)

class MemoryStore:
    """
    Handles the persistent storage of memory components like the Knowledge Graph.
    This implementation uses a simple JSON file for persistence.
    """
    def __init__(self, storage_path: str = "./memory_storage"):
        self.storage_path = storage_path
        self.kg_filepath = os.path.join(storage_path, "knowledge_graph.json")
        if not os.path.exists(self.storage_path):
            os.makedirs(self.storage_path)

    def save_knowledge_graph(self, knowledge_graph: KnowledgeGraph):
        """Saves the entire knowledge graph to a JSON file."""
        try:
            data_to_save = {
                "entities": knowledge_graph.entities,
                "relationships": knowledge_graph.relationships
            }
            with open(self.kg_filepath, 'w') as f:
                json.dump(data_to_save, f, indent=2)
            logger.info(f"Knowledge Graph saved to {self.kg_filepath}")
        except Exception as e:
            logger.error(f"Failed to save Knowledge Graph: {e}", exc_info=True)

    def load_knowledge_graph(self) -> KnowledgeGraph:
        """Loads the knowledge graph from a JSON file."""
        kg = KnowledgeGraph()
        if not os.path.exists(self.kg_filepath):
            logger.warning("Knowledge Graph file not found. Starting with an empty graph.")
            return kg

        try:
            with open(self.kg_filepath, 'r') as f:
                data = json.load(f)
                kg.entities = data.get("entities", {})
                kg.relationships = data.get("relationships", {})
            logger.info(f"Knowledge Graph loaded from {self.kg_filepath}")
        except Exception as e:
            logger.error(f"Failed to load Knowledge Graph, starting fresh: {e}", exc_info=True)
            # Return an empty graph if loading fails
            return KnowledgeGraph()

        return kg
