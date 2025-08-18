import pytest
from unittest.mock import MagicMock, AsyncMock
from ..app.semantic_search import SemanticSearch
from ..app.embedding_engine import EmbeddingEngine

@pytest.fixture
def semantic_search_engine(monkeypatch):
    """Fixture to create a SemanticSearch instance with mocked dependencies."""
    # Mock the embedding engine to avoid actual model loading/computation
    mock_embedding_engine = MagicMock(spec=EmbeddingEngine)
    mock_embedding_engine.generate_embedding.return_value = [0.1, 0.2, 0.3]
    mock_embedding_engine.find_similar.return_value = ["doc1"]

    engine = SemanticSearch(embedding_engine=mock_embedding_engine)

    # Also mock the cache manager methods to be async
    engine.query_optimizer.get_cached_query_result = AsyncMock(return_value=None)
    engine.query_optimizer.cache_query_result = AsyncMock()

    # Pre-index a document for the search to find
    engine.index_document("doc1", "This is the content of document 1.")

    return engine

@pytest.mark.asyncio
async def test_semantic_search_caching_flow(semantic_search_engine):
    """
    Tests that the SemanticSearch correctly uses the query cache.
    It should call the embedding engine on the first run and use the cache on the second.
    """
    query = "A test query"

    # --- First Call (should populate the cache) ---
    await semantic_search_engine.search(query, k=1)

    # Assert that the embedding engine was called
    semantic_search_engine.embedding_engine.generate_embedding.assert_called_once_with(query)
    # Assert that the result was cached
    assert semantic_search_engine.query_optimizer.cache_query_result.call_count == 1

    # --- Second Call (should hit the cache) ---

    # Reset mocks
    semantic_search_engine.embedding_engine.generate_embedding.reset_mock()

    # Configure the get_cached_query_result mock to return a value now
    cached_value = [{"id": "doc1", "content": "This is the content of document 1."}]
    semantic_search_engine.query_optimizer.get_cached_query_result.return_value = cached_value

    result = await semantic_search_engine.search(query, k=1)

    # Assert that the embedding engine was NOT called this time
    semantic_search_engine.embedding_engine.generate_embedding.assert_not_called()

    # Assert that the result is the cached value
    assert result == cached_value
