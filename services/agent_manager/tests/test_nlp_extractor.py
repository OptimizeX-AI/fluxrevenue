import pytest
import sys
import os

# Add the 'app' directory to the Python path to allow for absolute imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.nlp_extractor import NLPExtractor

@pytest.fixture(scope="module")
def extractor():
    """Provides a single NLPExtractor instance for all tests in this module."""
    return NLPExtractor()

def test_extractor_finds_architectures(extractor):
    """Tests that architectural keywords are correctly identified."""
    text = "I want a frontend and a backend API."
    entities = extractor.extract_entities(text)
    assert "frontend" in entities["architectures"]
    assert "backend" in entities["architectures"]
    assert "api" in entities["architectures"]

def test_extractor_finds_technologies(extractor):
    """Tests that technology keywords are correctly identified."""
    text = "Use react and postgresql for the database."
    entities = extractor.extract_entities(text)
    assert "react" in entities["technologies"]
    assert "postgresql" in entities["technologies"]

def test_extractor_finds_features(extractor):
    """Tests that feature keywords are correctly identified."""
    text = "It needs auth and jwt support for authentication."
    entities = extractor.extract_entities(text)
    assert "authentication" in entities["features"]
    assert "jwt" in entities["features"]

def test_extractor_handles_no_matches(extractor):
    """Tests that the extractor returns empty lists when no keywords match."""
    text = "A generic project description."
    entities = extractor.extract_entities(text)
    assert entities["architectures"] == []
    assert entities["technologies"] == []
    assert entities["features"] == []
