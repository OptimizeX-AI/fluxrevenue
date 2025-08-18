import pytest
from ..intent_classifier import IntentClassifier

@pytest.fixture
def classifier():
    """Provides an IntentClassifier instance for tests."""
    return IntentClassifier()

@pytest.mark.asyncio
@pytest.mark.parametrize("text, expected_intent", [
    ("qual o andamento do projeto X?", "project_status"),
    ("como eu faço para configurar o ambiente?", "technical_question"),
    ("por que o sistema escolheu essa abordagem?", "decision_explanation"),
    ("preciso de ajuda com um erro", "help_request"),
    ("o que o agente de qa faz?", "agent_info"),
    ("olá, tudo bem?", "greeting"),
    ("tchau, obrigado", "goodbye"),
    ("o tempo está bom hoje", "general_query"),
])
async def test_intent_classification(classifier, text, expected_intent):
    """
    Tests that the classifier correctly identifies the intent for various inputs.
    """
    classification = await classifier.classify(text)
    assert classification.intent == expected_intent
    assert 0.0 <= classification.confidence <= 1.0
