import json
import logging
from message_broker.rabbitmq_client import RabbitMQClient

logger = logging.getLogger(__name__)

def report_to_memory(rabbitmq_client: RabbitMQClient, project_name: str, source_agent: str, event_type: str, data: dict):
    """
    Constructs a standard event and publishes it to the memory queue via RabbitMQ.
    """
    event_payload = {
        "project_name": project_name,
        "source_agent": source_agent,
        "event_type": event_type,
        "data": data
    }

    try:
        message = RabbitMQClient.create_message(
            source_agent=source_agent,
            target_agent="memory_agent",
            task_type="record_event",
            payload=event_payload
        )
        rabbitmq_client.publish_message("memory_events", message)
        logger.debug("Reported event to memory.", extra={"props": {"project": project_name, "event": event_type}})
    except Exception as e:
        # Log error but don't crash the agent if memory reporting fails
        logger.error("Failed to report event to memory.", exc_info=True)
