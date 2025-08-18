# Chatbot Agent Service

## 1. Overview

The `chatbot_agent` is an intelligent, conversational AI service for the FluxRevenue platform. Its primary role is to act as a smart assistant, helping users understand and interact with the system by answering questions, explaining system decisions, and providing guidance on technical topics.

It is designed to be integrated with the main `web_interface` dashboard, providing a seamless user experience.

## 2. Architecture

The agent is built with a modular architecture, where each component has a specific responsibility:

-   **FastAPI Application (`main.py`)**: Serves the API endpoints, including the main WebSocket for real-time chat.
-   **Chat Engine (`chat_engine.py`)**: The central orchestrator that processes incoming messages and coordinates the other components.
-   **NLP Processor (`nlp_processor.py`)**: Handles initial text cleaning and preprocessing.
-   **Intent Classifier (`intent_classifier.py`)**: Determines the user's intent from their message using a scoring model.
-   **Knowledge Retriever (`knowledge_retriever.py`)**: Fetches relevant information from other FluxRevenue services (e.g., `project_orchestrator`, `memory_agent`) based on the classified intent.
-   **Conversation Manager (`conversation_manager.py`)**: Manages the conversation history and context for each user, using Redis for persistence.
-   **Response Generator (`response_generator.py`)**: Formats the retrieved knowledge into a natural, user-friendly response.

## 3. Getting Started

### Prerequisites

- Docker and Docker Compose must be installed.
- A running Redis instance is required for conversation context management (this is handled by the main `docker-compose.yml`).

### Running the Service

The `chatbot_agent` is managed as part of the main `docker-compose.yml` file. To run it, use the following command from the project root:

```bash
# To run the chatbot and its dependencies
docker-compose up --build chatbot_agent

# To run all services
docker-compose up --build
```

The service will be available on port `8012` on the host machine.

## 4. API

The service exposes a WebSocket endpoint for chat communication.

-   **Endpoint**: `ws://localhost:8012/api/v1/chat/ws/{user_id}`
-   **User ID**: A unique identifier for the user to maintain conversation context.

### Message Format

-   **Client to Server**: Clients should send messages as a JSON string with the following format:
    ```json
    {
      "type": "user_message",
      "text": "Your message here",
      "timestamp": "ISO_8601_timestamp"
    }
    ```
-   **Server to Client**: The server responds with a `ChatResponse` object, also as a JSON string. See `api/models.py` for the full structure.

For interactive API documentation (for any HTTP endpoints like `/health`), see the auto-generated docs at `http://localhost:8012/api/v1/chat/docs`.

## 5. Testing

The service includes a suite of unit and integration tests using `pytest`.

To run the tests, you can execute the following command inside the service's running container:

1.  Find the container ID: `docker ps`
2.  Exec into the container: `docker exec -it <container_id> /bin/bash`
3.  Run pytest from the `/app` directory:
    ```bash
    pytest
    ```
