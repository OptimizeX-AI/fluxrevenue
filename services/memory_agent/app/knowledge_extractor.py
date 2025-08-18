import logging
from typing import Dict, Any
from .knowledge_graph import KnowledgeGraph
from .semantic_search import SemanticSearch

logger = logging.getLogger(__name__)

class KnowledgeExtractor:
    """
    Extracts structured knowledge from raw text and integrates it into the memory systems.
    """
    def __init__(self, kg: KnowledgeGraph, search: SemanticSearch):
        self.kg = kg
        self.search = search
        logger.info("KnowledgeExtractor initialized.")

    def extract_and_integrate(self, text_content: str, source_uri: str, content_type: str):
        """
        Processes text content to extract and store knowledge.

        Args:
            text_content: The raw text extracted from a file.
            source_uri: The identifier for the source document (e.g., its filepath).
            content_type: The type of content (e.g., 'markdown', 'source_code').
        """
        if not text_content:
            logger.warning(f"No content to extract from {source_uri}.")
            return

        logger.info(f"Extracting knowledge from {source_uri} ({content_type}).")

        # 1. Add the document itself as an entity in the Knowledge Graph
        document_name = source_uri.split('/')[-1]
        self.kg.add_entity(
            entity_id=source_uri,
            entity_type="TechnicalDocument",
            data={"name": document_name, "format": content_type}
        )

        # 2. Index the full document for semantic search
        self.search.index_document(doc_id=source_uri, content=text_content)

        # 3. Perform simple keyword-based entity extraction (Proof-of-Concept)
        # A real system would use NLP/NER models here.
        self._extract_concepts(text_content, source_uri)

    def _extract_concepts(self, text_content: str, source_uri: str):
        """
        A simple placeholder for a real Named Entity Recognition (NER) system.
        It looks for keywords of known technologies and links them to the document.
        """
        known_technologies = {
            "FastAPI": "A Python web framework.",
            "React": "A JavaScript library for building user interfaces.",
            "Django": "A high-level Python Web framework.",
            "RabbitMQ": "An open-source message broker.",
            "PostgreSQL": "An open-source object-relational database system.",
            "Docker": "A platform for developing, shipping, and running applications in containers."
        }

        for tech, description in known_technologies.items():
            if tech.lower() in text_content.lower():
                # Add the technology as an entity in the KG if it doesn't exist
                self.kg.add_entity(
                    entity_id=tech,
                    entity_type="Technology",
                    data={"name": tech, "description": description}
                )
                # Link the document to the technology
                self.kg.add_relationship(
                    source_id=source_uri,
                    target_id=tech,
                    relationship_type="MENTIONS"
                )
