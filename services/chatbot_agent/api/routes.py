from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from ..chat_engine import FluxChatEngine
from .models import UserMessage
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["Chatbot"])
chat_engine = FluxChatEngine()

@router.get("/health", summary="Health Check")
async def health_check():
    """
    Endpoint to check the health of the chatbot agent service.
    """
    return {"status": "ok"}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time chat communication.
    Handles user messages and sends back responses from the chat engine.
    """
    await websocket.accept()
    logger.info(f"WebSocket connection established for user: {user_id}")
    try:
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)

            if data.get("type") == "user_message":
                logger.info(f"Received message from {user_id}: {data.get('text')}")
                user_message = UserMessage(user_id=user_id, text=data.get("text", ""))
                response = await chat_engine.process_message(user_message)
                await websocket.send_text(response.json())
                logger.info(f"Sent response to {user_id}: {response.text}")
            else:
                logger.warning(f"Received invalid message type from {user_id}")
                await websocket.send_text(json.dumps({"error": "Invalid message type"}))

    except WebSocketDisconnect:
        logger.info(f"User {user_id} disconnected.")
    except json.JSONDecodeError:
        logger.error(f"Failed to decode JSON from user {user_id}")
    except Exception as e:
        logger.error(f"An unexpected error occurred for user {user_id}: {e}", exc_info=True)
        await websocket.close(code=1011, reason=f"Internal server error: {e}")
