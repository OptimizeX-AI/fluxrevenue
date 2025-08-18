import pytest
import pytest_asyncio
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

from services.memory_agent.app.models import Base, ProjectEvent, ProjectDecision
from services.memory_agent.app.memory_processor import process_event

# Use an in-memory SQLite database for testing, which supports asyncio
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Creates a new database session for a test and handles setup/teardown."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_process_event_logs_generic_event(db_session: AsyncSession):
    """Tests that a generic event is correctly logged to the ProjectEvent table."""
    event_data = {
        "project_name": "test_project_1",
        "source_agent": "test_agent",
        "event_type": "generic_event",
        "data": {"info": "some data"}
    }
    await process_event(event_data, db_session)

    result = await db_session.execute(select(ProjectEvent))
    events = result.scalars().all()
    assert len(events) == 1
    assert events[0].project_name == "test_project_1"
    assert events[0].event_type == "generic_event"
    assert events[0].data["info"] == "some data"

@pytest.mark.asyncio
async def test_process_event_stores_decision(db_session: AsyncSession):
    """Tests that a 'decision_made' event is also stored in the ProjectDecision table."""
    event_data = {
        "project_name": "test_project_2",
        "source_agent": "code_architect",
        "event_type": "decision_made",
        "data": {"key": "backend_framework", "value": "fastapi"}
    }
    await process_event(event_data, db_session)

    # Check that it was logged as an event
    event_result = await db_session.execute(select(ProjectEvent))
    assert len(event_result.scalars().all()) == 1

    # Check that it was also stored as a canonical decision
    decision_result = await db_session.execute(select(ProjectDecision))
    decisions = decision_result.scalars().all()
    assert len(decisions) == 1
    assert decisions[0].project_name == "test_project_2"
    assert decisions[0].decision_key == "backend_framework"
    assert decisions[0].decision_value == "fastapi"

@pytest.mark.asyncio
async def test_coherence_check_logs_error_on_contradiction(db_session: AsyncSession, caplog):
    """
    Tests that the coherence check logs a high-severity error when an action
    contradicts a previously stored decision.
    """
    project_name = "test_project_3"
    # 1. An agent makes a decision
    decision_event = {
        "project_name": project_name,
        "source_agent": "code_architect",
        "event_type": "decision_made",
        "data": {"key": "backend_framework", "value": "fastapi"}
    }
    await process_event(decision_event, db_session)

    # 2. Another agent takes a contradictory action
    action_event = {
        "project_name": project_name,
        "source_agent": "developer_agent",
        "event_type": "action_taken",
        "data": {"framework_used": "django"}
    }

    # Run the processing and capture logs at ERROR level
    with caplog.at_level(logging.ERROR):
        await process_event(action_event, db_session)

    # 3. Assert that a high-severity error was logged by inspecting the log records
    error_record = next((r for r in caplog.records if r.levelname == 'ERROR' and 'COHERENCE ALERT' in r.message), None)

    assert error_record is not None, "An error log for coherence alert should have been created."

    # Check the structured properties of the log
    props = getattr(error_record, 'props', {})
    assert props.get('decision') == "backend_framework should be 'fastapi'"
    assert props.get('action_taken') == "used framework 'django'"
