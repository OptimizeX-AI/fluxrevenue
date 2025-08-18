from ....common.performance.cache_manager import CacheManager
from typing import Optional, List, Dict, Any
import json
import hashlib

class QueryOptimizer:
    """
    Optimizes and caches expensive queries to the memory store (e.g., Knowledge Graph).
    """
    def __init__(self):
        self.cache_manager = CacheManager()
        # In a full implementation, a connection pool for the database/KG would be managed here.
        # self.connection_pool = DatabaseConnectionPool()

    def _hash_query(self, query: Dict[str, Any]) -> str:
        """
        Creates a stable SHA256 hash from a query dictionary to use as a cache key.
        Sorting the dictionary ensures that semantically identical queries
        produce the same hash.
        """
        # Convert dict to a sorted JSON string to ensure consistent hashing
        sorted_query_str = json.dumps(query, sort_keys=True)
        hashed_query = hashlib.sha256(sorted_query_str.encode()).hexdigest()
        return f"query:{hashed_query}"

    async def get_cached_query_result(self, query: Dict[str, Any]) -> Optional[List[Any]]:
        """
        Retrieves a cached query result from the CacheManager.
        """
        cache_key = self._hash_query(query)
        return await self.cache_manager.get_cached_result(cache_key)

    async def cache_query_result(self, query: Dict[str, Any], result: List[Any]):
        """
        Caches a new query result using the CacheManager.
        Query results are cached for 15 minutes by default.
        """
        cache_key = self._hash_query(query)
        await self.cache_manager.cache_result(cache_key, result, ttl=900)
