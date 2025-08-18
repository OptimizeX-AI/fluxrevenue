import time
import json
import redis
import os
from typing import Any, Optional, Dict

class LocalCache:
    """
    A simple in-memory cache with Time-To-Live (TTL) support.
    """
    def __init__(self, max_size: int = 1000):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size

    def get(self, key: str) -> Optional[Any]:
        """Retrieves an item from the cache if it exists and has not expired."""
        item = self._cache.get(key)
        if item and time.time() < item["expiry"]:
            return item["value"]
        if item:
            # Clean up expired item
            del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: int):
        """Adds an item to the cache with a TTL."""
        if len(self._cache) >= self.max_size:
            # Simple eviction strategy: remove the oldest item
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]

        self._cache[key] = {
            "value": value,
            "expiry": time.time() + ttl
        }

class CacheManager:
    """
    A two-level cache manager that uses a local in-memory cache (L1) and
    a distributed Redis cache (L2).
    """
    def __init__(self):
        try:
            redis_host = os.getenv("REDIS_HOST", "localhost")
            self.redis_client = redis.Redis(host=redis_host, port=6379, db=1, decode_responses=True) # Use DB 1 for cache
            self.redis_client.ping()
        except redis.exceptions.ConnectionError:
            self.redis_client = None

        self.local_cache = LocalCache(max_size=1000)

    async def get_cached_result(self, key: str, ttl: int = 300) -> Optional[Any]:
        """
        Gets a result from the cache, checking L1 (local) then L2 (Redis).
        If found in L2, it populates L1.
        """
        # 1. Check local L1 cache
        local_result = self.local_cache.get(key)
        if local_result is not None:
            return local_result

        # 2. Check distributed L2 cache (Redis)
        if self.redis_client:
            redis_result = self.redis_client.get(key)
            if redis_result:
                deserialized_result = json.loads(redis_result)
                # Populate L1 cache for subsequent requests
                self.local_cache.set(key, deserialized_result, ttl)
                return deserialized_result

        return None

    async def cache_result(self, key: str, value: Any, ttl: int = 300):
        """
        Stores a result in both L1 and L2 caches.
        """
        # 1. Store in local L1 cache
        self.local_cache.set(key, value, ttl)

        # 2. Store in distributed L2 cache (Redis)
        if self.redis_client:
            # Serialize value for Redis storage
            serialized_value = json.dumps(value)
            self.redis_client.setex(key, ttl, serialized_value)
