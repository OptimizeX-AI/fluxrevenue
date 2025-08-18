import pytest
from unittest.mock import AsyncMock
from ..advanced_nlp import AdvancedNLPEngine
from ..content_generator import AdvancedContentGenerator
from ..models import SemanticUnderstanding, Intent, Entity, Sentiment

# --- Tests for AdvancedNLPEngine ---

@pytest.fixture
def nlp_engine():
    """Provides an AdvancedNLPEngine instance with mocked components."""
    engine = AdvancedNLPEngine()
    engine.intent_analyzer.extract_multiple_intents = AsyncMock(return_value=[Intent(name="test_intent", confidence=0.9)])
    engine.entity_extractor.extract_entities = AsyncMock(return_value=[Entity(text="test", label="TEST", start_char=0, end_char=4)])
    engine.sentiment_analyzer.analyze_sentiment = AsyncMock(return_value=Sentiment(polarity=0.1, subjectivity=0.2))
    engine.context_manager.process_context = AsyncMock(return_value={"processed": True})
    return engine

@pytest.mark.asyncio
async def test_understand_complex_query_orchestration(nlp_engine):
    """
    Tests that understand_complex_query calls its components in the correct order.
    """
    await nlp_engine.understand_complex_query("test query", context={})

    nlp_engine.intent_analyzer.extract_multiple_intents.assert_called_once_with("test query")
    nlp_engine.entity_extractor.extract_entities.assert_called_once_with("test query")
    nlp_engine.sentiment_analyzer.analyze_sentiment.assert_called_once_with("test query")
    nlp_engine.context_manager.process_context.assert_called_once_with({}, "test query")

# --- Tests for AdvancedContentGenerator ---

@pytest.fixture
def content_generator():
    """Provides an AdvancedContentGenerator instance with mocked components."""
    generator = AdvancedContentGenerator()
    generator._search_relevant_knowledge = AsyncMock(return_value={"facts": []})
    generator._structure_content = AsyncMock(return_value={"outline": []})
    generator.generation_models.generate = AsyncMock(return_value="draft content")
    generator.fact_checker.verify_content = AsyncMock(return_value="verified content")
    generator.style_transfer.adapt_style = AsyncMock(return_value="final content")
    return generator

@pytest.mark.asyncio
async def test_generate_technical_documentation_orchestration(content_generator):
    """
    Tests that generate_technical_documentation calls its components in the correct order.
    """
    await content_generator.generate_technical_documentation("topic", "audience", "depth")

    content_generator._search_relevant_knowledge.assert_called_once_with("topic")
    content_generator._structure_content.assert_called_once()
    content_generator.generation_models.generate.assert_called_once()
    content_generator.fact_checker.verify_content.assert_called_once_with("draft content")
    content_generator.style_transfer.adapt_style.assert_called_once_with("verified content", "audience", "depth")
