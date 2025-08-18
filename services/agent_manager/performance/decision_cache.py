from ....common.performance.cache_manager import CacheManager
from typing import Optional, Dict, Any
import hashlib

class DecisionCache:
    """
    A specific cache handler for caching decisions made by the DecisionEngine.
    """
    def __init__(self):
        self.cache_manager = CacheManager()

    def _get_cache_key(self, task_description: str) -> str:
        """
        Creates a consistent and safe cache key from the task description
        using a SHA256 hash.
        """
        # Using a hash function to ensure keys are uniform and don't contain special characters
        hashed_desc = hashlib.sha256(task_description.encode()).hexdigest()
        return f"decision:{hashed_desc}"

    async def get_cached_decision(self, task_description: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a cached decision for a given task description from the CacheManager.
        """
        cache_key = self._get_cache_key(task_description)
        return await self.cache_manager.get_cached_result(cache_key)

    async def cache_decision(self, task_description: str, decision: Dict[str, Any]):
        """
        Caches a new decision using the CacheManager. Decisions are cached for
        1 hour by default.
        """
        cache_key = self._get_cache_key(task_description)
        # TTL set to 3600 seconds (1 hour) as decisions for similar tasks are likely to be reusable
        await self.cache_manager.cache_result(cache_key, decision, ttl=3600)
