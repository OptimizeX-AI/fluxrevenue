import logging
from sqlalchemy.future import select
from sqlalchemy.exc import SQLAlchemyError

from services.memory_agent.app.models import ProjectEvent, ProjectDecision
from services.memory_agent.app.core.exceptions import MemoryStorageError, EventValidationError

logger = logging.getLogger(__name__)

async def process_event(event_data: dict, session):
    """
    Processes an incoming event, logs it to the database, and performs coherence checks.
    """
    try:
        # 1. Validate and Log Every Event
        project_name = event_data.get("project_name")
        source_agent = event_data.get("source_agent")
        event_type = event_data.get("event_type")

        if not all([project_name, source_agent, event_type]):
            raise EventValidationError("Event data is missing required fields.", details=event_data)

        event = ProjectEvent(
            project_name=project_name,
            source_agent=source_agent,
            event_type=event_type,
            data=event_data.get("data", {})
        )
        session.add(event)
        logger.debug("Logged event to database.", extra={"props": {"project": project_name, "event": event_type}})

        # 2. Handle specific event types for coherence logic
        if event_type == "decision_made":
            decision_data = event.data
            if "key" in decision_data and "value" in decision_data:
                new_decision = ProjectDecision(
                    project_name=project_name,
                    decision_key=decision_data["key"],
                    decision_value=decision_data["value"]
                )
                session.add(new_decision)
                logger.info("Stored new project decision.", extra={"props": {"project": project_name, "key": decision_data["key"], "value": decision_data["value"]}})
            else:
                logger.warning("Received 'decision_made' event with missing key or value.", extra={"props": event_data})

        elif event_type == "action_taken":
            action_data = event.data
            # Example Coherence Check: Does the action's framework match the decided framework?
            if action_data and "framework_used" in action_data:
                # Query for the architectural decision on backend framework
                result = await session.execute(
                    select(ProjectDecision).where(
                        ProjectDecision.project_name == project_name,
                        ProjectDecision.decision_key == "backend_framework"
                    )
                )
                framework_decision = result.scalar_one_or_none()

                if framework_decision and action_data["framework_used"] != framework_decision.decision_value:
                    logger.error(
                        "COHERENCE ALERT: Action contradicts a prior architectural decision.",
                        extra={"props": {
                            "project": project_name,
                            "source_agent": source_agent,
                            "decision": f"backend_framework should be '{framework_decision.decision_value}'",
                            "action_taken": f"used framework '{action_data['framework_used']}'"
                        }}
                    )

        await session.commit()

    except SQLAlchemyError as e:
        logger.error("Database error while processing memory event.", exc_info=True)
        await session.rollback()
        raise MemoryStorageError("Failed to persist event due to database error.", original_exception=e)
    except Exception as e:
        logger.error("Unexpected error while processing memory event.", exc_info=True)
        await session.rollback()
        raise
