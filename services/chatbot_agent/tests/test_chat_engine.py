import pytest
from ..chat_engine import FluxChatEngine
from ..api.models import UserMessage

@pytest.fixture
def chat_engine():
    """Provides a FluxChatEngine instance for tests."""
    return FluxChatEngine()

@pytest.mark.asyncio
async def test_process_greeting_message(chat_engine):
    """Tests that a greeting message receives a greeting response."""
    user_message = UserMessage(user_id="test_user", text="Olá")
    response = await chat_engine.process_message(user_message)

    assert response.intent == "greeting"
    assert "olá" in response.text.lower()

@pytest.mark.asyncio
async def test_process_project_status_query(chat_engine):
    """Tests that a project status query is classified correctly and returns relevant info."""
    user_message = UserMessage(user_id="test_user", text="qual o status do projeto FluxRevenue?")
    response = await chat_engine.process_message(user_message)

    assert response.intent == "project_status"
    assert "fluxrevenue" in response.text.lower()
    assert "status" in response.text.lower()
    assert "progresso" in response.text.lower()

@pytest.mark.asyncio
async def test_process_technical_question(chat_engine):
    """Tests that a technical question is classified correctly."""
    user_message = UserMessage(user_id="test_user", text="como eu implemento um agente?")
    response = await chat_engine.process_message(user_message)

    assert response.intent == "technical_question"
    assert "documentação" in response.text.lower() or "ajudar" in response.text.lower()

@pytest.mark.asyncio
async def test_process_agent_info_query(chat_engine):
    """Tests a query about an agent's capabilities."""
    user_message = UserMessage(user_id="test_user", text="o que o agente developer_agent faz?")
    response = await chat_engine.process_message(user_message)

    assert response.intent == "agent_info"
    assert "developer_agent" in response.text.lower()
    assert "capacidades" in response.text.lower()

@pytest.mark.asyncio
async def test_process_general_query(chat_engine):
    """Tests that a generic or unclear query returns a general response."""
    user_message = UserMessage(user_id="test_user", text="e o céu?")
    response = await chat_engine.process_message(user_message)

    assert response.intent == "general_query"
    assert "não tenho certeza" in response.text.lower() or "não entendi" in response.text.lower()
