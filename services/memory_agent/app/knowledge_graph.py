import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class KnowledgeGraph:
    """
    A simple in-memory representation of a knowledge graph.
    It stores entities and the relationships between them.
    """
    def __init__(self):
        self.entities: Dict[str, Dict] = {}  # entity_id -> entity_data
        self.relationships: Dict[str, List[Dict]] = {}  # source_entity_id -> list of {type, target_id}

    def add_entity(self, entity_id: str, entity_type: str, data: dict):
        """
        Adds or updates an entity in the knowledge graph.
        An entity can be a project, a file, a task, an agent, etc.
        """
        if entity_id in self.entities:
            self.entities[entity_id].update(data)
            logger.info(f"Updated entity '{entity_id}'.")
        else:
            self.entities[entity_id] = {"type": entity_type, **data}
            logger.info(f"Added new entity '{entity_id}' of type '{entity_type}'.")

        if entity_id not in self.relationships:
            self.relationships[entity_id] = []

    def add_relationship(self, source_id: str, target_id: str, relationship_type: str):
        """
        Adds a directional relationship between two entities.
        Example: (task_123) -[GENERATED]-> (file_abc.py)
        """
        if source_id not in self.entities or target_id not in self.entities:
            logger.warning(f"Cannot add relationship. Source '{source_id}' or target '{target_id}' not found.")
            return

        # Avoid duplicate relationships
        for rel in self.relationships.get(source_id, []):
            if rel['type'] == relationship_type and rel['target'] == target_id:
                return

        self.relationships.setdefault(source_id, []).append({
            "type": relationship_type,
            "target": target_id
        })
        logger.info(f"Added relationship: ({source_id})-[{relationship_type}]->({target_id})")

    def get_entity(self, entity_id: str) -> Optional[Dict]:
        """Retrieves an entity's data."""
        return self.entities.get(entity_id)

    def get_relationships(self, entity_id: str) -> List[Dict]:
        """Retrieves all relationships originating from an entity."""
        return self.relationships.get(entity_id, [])

    def query_knowledge(self, entity_id: str, relationship_type: Optional[str] = None) -> List[Dict]:
        """
        A simple query method to find entities related to a given entity.
        """
        related_entities = []
        for rel in self.get_relationships(entity_id):
            if relationship_type is None or rel['type'] == relationship_type:
                target_entity = self.get_entity(rel['target'])
                if target_entity:
                    related_entities.append({
                        "relationship": rel['type'],
                        "entity": target_entity
                    })
        return related_entities
