import logging
from typing import Dict, List
from .embedding_engine import EmbeddingEngine

logger = logging.getLogger(__name__)

class SemanticSearch:
    """
    Provides semantic search capabilities over a collection of documents.
    Uses an EmbeddingEngine to convert text to vectors and find similarities.
    """
    def __init__(self, embedding_engine: EmbeddingEngine):
        self.embedding_engine = embedding_engine
        self.document_store: Dict[str, str] = {}  # doc_id -> content
        self.embedding_index: Dict[str, List[float]] = {} # doc_id -> embedding

    def index_document(self, doc_id: str, content: str):
        """
        Adds a document to the search index.
        This involves storing the content and generating/storing its embedding.
        """
        if not content:
            logger.warning(f"Content for document '{doc_id}' is empty. Skipping indexing.")
            return

        self.document_store[doc_id] = content
        embedding = self.embedding_engine.generate_embedding(content)
        self.embedding_index[doc_id] = embedding
        logger.info(f"Indexed document '{doc_id}'.")

    def search(self, query: str, k: int = 5) -> List[Dict[str, str]]:
        """
        Performs a semantic search for a given query.

        Args:
            query: The search query string.
            k: The number of results to return.

        Returns:
            A list of dictionaries, where each dictionary contains the document ID
            and its content.
        """
        if not query:
            return []

        query_embedding = self.embedding_engine.generate_embedding(query)

        similar_doc_ids = self.embedding_engine.find_similar(
            query_embedding,
            self.embedding_index,
            k=k
        )

        results = [
            {"id": doc_id, "content": self.document_store[doc_id]}
            for doc_id in similar_doc_ids
            if doc_id in self.document_store
        ]

        return results

    def remove_document(self, doc_id: str):
        """Removes a document from the search index."""
        if doc_id in self.document_store:
            del self.document_store[doc_id]
        if doc_id in self.embedding_index:
            del self.embedding_index[doc_id]
        logger.info(f"Removed document '{doc_id}' from index.")
