MESSAGE_SCHEMA = {
    "type": "object",
    "properties": {
        "message_id": {"type": "string", "format": "uuid"},
        "timestamp": {"type": "string", "format": "date-time"},
        "source_agent": {"type": "string"},
        "target_agent": {"type": "string"},
        "task_type": {"type": "string"},
        "priority": {"type": "integer"},
        "payload": {"type": "object"},
        "metadata": {
            "type": "object",
            "properties": {
                "correlation_id": {"type": "string"},
                "retry_count": {"type": "integer"}
            },
            "required": ["correlation_id", "retry_count"]
        }
    },
    "required": ["message_id", "timestamp", "source_agent", "target_agent", "task_type", "priority", "payload", "metadata"]
}
