from .api.models import ConversationContext
from datetime import datetime
import json
import redis
import os

class ConversationManager:
    """
    Manages the context and history of conversations using Redis for persistence.
    """
    def __init__(self):
        """
        Initializes the Redis client connection.
        """
        try:
            redis_host = os.getenv("REDIS_HOST", "localhost")
            self.redis_client = redis.Redis(host=redis_host, port=6379, db=0, decode_responses=True)
            self.redis_client.ping()
            print("Successfully connected to Redis.")
        except redis.exceptions.ConnectionError as e:
            print(f"Error connecting to Redis: {e}")
            # Fallback to in-memory store if Redis is not available
            self.redis_client = None
            self.in_memory_store: dict[str, str] = {}

        self.conversation_ttl = 3600  # Conversations expire after 1 hour

    def get_context(self, user_id: str) -> ConversationContext:
        """
        Retrieves the conversation context for a given user from Redis.
        Falls back to in-memory store if Redis connection failed.
        """
        if not self.redis_client:
            context_data = self.in_memory_store.get(user_id)
        else:
            key = f"conversation:{user_id}"
            context_data = self.redis_client.get(key)

        if context_data:
            return ConversationContext(**json.loads(context_data))
        return ConversationContext(user_id=user_id, history=[])

    def update_context(self, user_id: str, user_message: str, bot_response: str):
        """
        Updates the conversation context with the latest interaction in Redis.
        Falls back to in-memory store if Redis connection failed.
        """
        context = self.get_context(user_id)

        context.history.append({
            "timestamp": datetime.now().isoformat(),
            "role": "user",
            "message": user_message
        })
        context.history.append({
            "timestamp": datetime.now().isoformat(),
            "role": "assistant",
            "message": bot_response
        })

        # Keep only the last 20 interactions (10 pairs)
        context.history = context.history[-20:]
        context.last_interaction = datetime.now()

        context_json = context.json()

        if not self.redis_client:
            self.in_memory_store[user_id] = context_json
        else:
            key = f"conversation:{user_id}"
            self.redis_client.setex(key, self.conversation_ttl, context_json)
