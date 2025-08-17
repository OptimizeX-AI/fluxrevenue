import json
import logging

logger = logging.getLogger(__name__)

async def report_to_memory(redis_client, project_name: str, source_agent: str, event_type: str, data: dict):
    """
    Constructs a standard event and publishes it to the memory channel.
    """
    event = {
        "project_name": project_name,
        "source_agent": source_agent,
        "event_type": event_type,
        "data": data
    }
    try:
        await redis_client.publish("memory_events", json.dumps(event))
        logger.debug("Reported event to memory.", extra={"props": {"project": project_name, "event": event_type}})
    except Exception as e:
        # Log error but don't crash the agent if memory reporting fails
        logger.error("Failed to report event to memory.", exc_info=True)
