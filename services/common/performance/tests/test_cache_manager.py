import pytest
import time
import json
from unittest.mock import MagicMock
from ..cache_manager import LocalCache, CacheManager

# --- Tests for LocalCache ---

def test_local_cache_set_and_get():
    cache = LocalCache()
    cache.set("key1", "value1", ttl=10)
    assert cache.get("key1") == "value1"

def test_local_cache_expired_item():
    cache = LocalCache()
    cache.set("key1", "value1", ttl=-1) # Expired in the past
    assert cache.get("key1") is None

def test_local_cache_eviction():
    cache = LocalCache(max_size=2)
    cache.set("key1", "value1", ttl=10)
    cache.set("key2", "value2", ttl=10)
    cache.set("key3", "value3", ttl=10) # This should evict key1
    assert cache.get("key1") is None
    assert cache.get("key2") == "value2"
    assert cache.get("key3") == "value3"

# --- Tests for CacheManager ---

@pytest.fixture
def mock_redis_client():
    """Fixture to create a mock redis client."""
    mock_redis = MagicMock()
    mock_redis.get.return_value = None
    mock_redis.setex.return_value = True
    return mock_redis

@pytest.fixture
def cache_manager(monkeypatch, mock_redis_client):
    """Fixture to create a CacheManager with a mocked redis client."""
    # Mock the redis.Redis connection to return our mock client
    monkeypatch.setattr('redis.Redis', lambda **kwargs: mock_redis_client)
    manager = CacheManager()
    # Ensure the mock is used instead of the real one, even if connection fails
    manager.redis_client = mock_redis_client
    return manager

@pytest.mark.asyncio
async def test_cache_manager_get_from_local_cache(cache_manager):
    """Test that get_cached_result retrieves from local cache first."""
    cache_manager.local_cache.set("key1", "local_value", ttl=10)
    result = await cache_manager.get_cached_result("key1")

    assert result == "local_value"
    # Redis client should not have been called
    cache_manager.redis_client.get.assert_not_called()

@pytest.mark.asyncio
async def test_cache_manager_get_from_redis_and_populate_local(cache_manager):
    """Test that a redis hit populates the local cache."""
    redis_value = {"data": "value_from_redis"}
    serialized_redis_value = json.dumps(redis_value)
    cache_manager.redis_client.get.return_value = serialized_redis_value

    # First, ensure local cache is empty
    assert cache_manager.local_cache.get("key1") is None

    # Get the result, which should come from Redis
    result = await cache_manager.get_cached_result("key1")
    assert result == redis_value
    cache_manager.redis_client.get.assert_called_with("key1")

    # Now, the local cache should be populated
    assert cache_manager.local_cache.get("key1") == redis_value

@pytest.mark.asyncio
async def test_cache_manager_get_miss(cache_manager):
    """Test a cache miss from both local and redis."""
    cache_manager.redis_client.get.return_value = None
    result = await cache_manager.get_cached_result("key1")
    assert result is None
    cache_manager.redis_client.get.assert_called_with("key1")

@pytest.mark.asyncio
async def test_cache_manager_set_writes_to_both_caches(cache_manager):
    """Test that cache_result writes to both local and Redis caches."""
    value_to_cache = {"data": "some_value"}
    ttl = 60

    await cache_manager.cache_result("key1", value_to_cache, ttl=ttl)

    # Check local cache
    assert cache_manager.local_cache.get("key1") == value_to_cache

    # Check Redis cache
    serialized_value = json.dumps(value_to_cache)
    cache_manager.redis_client.setex.assert_called_with("key1", ttl, serialized_value)
