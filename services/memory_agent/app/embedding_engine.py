import logging
from typing import List, Dict, Any
import numpy as np

logger = logging.getLogger(__name__)

class EmbeddingEngine:
    """
    A simulated embedding engine.
    In a real implementation, this would use a pre-trained model (e.g., from sentence-transformers).
    For this task, we simulate the functionality without the heavy dependency.
    """
    def __init__(self):
        self.model = self._load_custom_model()
        self.vector_dim = 10 # A small dimension for simulation purposes

    def _load_custom_model(self) -> Any:
        """
        Placeholder for loading a real, locally-trained ML model.
        """
        logger.info("Simulating the loading of a custom embedding model.")
        # In a real scenario: self.model = SentenceTransformer('all-MiniLM-L6-v2')
        return "simulated_model"

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates a deterministic, simulated embedding for a given text.
        The embedding is based on the hash of the text to ensure it's deterministic
        but still seemingly random.
        """
        if not text:
            return [0.0] * self.vector_dim

        # Create a deterministic "embedding" based on the hash of the text
        seed = hash(text)
        np.random.seed(seed % (2**32 - 1)) # Seed numpy's random generator
        embedding = np.random.rand(self.vector_dim).tolist()
        return embedding

    def find_similar(self, query_embedding: List[float], document_embeddings: Dict[str, List[float]], k: int = 5) -> List[str]:
        """
        Finds the most similar documents to a query embedding using cosine similarity.

        Args:
            query_embedding: The embedding of the query text.
            document_embeddings: A dictionary where keys are doc IDs and values are their embeddings.
            k: The number of similar documents to return.

        Returns:
            A list of the top-k most similar document IDs.
        """
        if not document_embeddings:
            return []

        query_vec = np.array(query_embedding)

        doc_ids = list(document_embeddings.keys())
        doc_matrix = np.array(list(document_embeddings.values()))

        # Calculate cosine similarity
        # dot(a, b) / (norm(a) * norm(b))
        dot_products = np.dot(doc_matrix, query_vec)
        doc_norms = np.linalg.norm(doc_matrix, axis=1)
        query_norm = np.linalg.norm(query_vec)

        # Handle potential zero-norm vectors to avoid division by zero
        if query_norm == 0 or np.any(doc_norms == 0):
            return [] # Cannot compute similarity

        similarities = dot_products / (doc_norms * query_norm)

        # Get the indices of the top-k similarities
        # Using argpartition is more efficient than argsort for finding top-k
        if len(similarities) > k:
            top_k_indices = np.argpartition(similarities, -k)[-k:]
        else:
            top_k_indices = np.arange(len(similarities))

        # Sort these top-k indices by similarity score
        top_k_sorted_indices = top_k_indices[np.argsort(similarities[top_k_indices])][::-1]

        return [doc_ids[i] for i in top_k_sorted_indices]
