import logging
from typing import Dict, List, Any
from .embedding_engine import EmbeddingEngine
from ..performance.query_optimizer import QueryOptimizer

logger = logging.getLogger(__name__)

class SemanticSearch:
    """
    Provides semantic search capabilities over a collection of documents.
    Uses an EmbeddingEngine to convert text to vectors and find similarities.
    Now includes caching to optimize search performance.
    """
    def __init__(self, embedding_engine: EmbeddingEngine):
        self.embedding_engine = embedding_engine
        self.document_store: Dict[str, str] = {}  # doc_id -> content
        self.embedding_index: Dict[str, List[float]] = {} # doc_id -> embedding
        self.query_optimizer = QueryOptimizer()

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

    async def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """
        Performs a semantic search for a given query, with caching.
        """
        if not query:
            return []

        # 1. Check cache for previous results for this query
        query_dict = {"type": "semantic_search", "query": query, "k": k}
        cached_results = await self.query_optimizer.get_cached_query_result(query_dict)
        if cached_results is not None:
            logger.info(f"Returning cached result for semantic search query: '{query[:50]}...'")
            return cached_results

        # 2. If not cached, perform the actual search
        logger.info(f"Performing new semantic search for query: '{query[:50]}...'")
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

        # 3. Cache the new results before returning
        await self.query_optimizer.cache_query_result(query_dict, results)

        return results

    def remove_document(self, doc_id: str):
        """Removes a document from the search index."""
        if doc_id in self.document_store:
            del self.document_store[doc_id]
        if doc_id in self.embedding_index:
            del self.embedding_index[doc_id]
        logger.info(f"Removed document '{doc_id}' from index.")
