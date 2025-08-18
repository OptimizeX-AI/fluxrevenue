from .api.models import UserMessage, ChatResponse
from .intent_classifier import IntentClassifier
from .knowledge_retriever import KnowledgeRetriever
from .response_generator import ResponseGenerator
from .conversation_manager import ConversationManager
from .nlp_processor import NLPProcessor
import uuid
from datetime import datetime

class FluxChatEngine:
    """
    The main engine for the chatbot. It orchestrates the entire process
    of receiving a message, processing it, and returning a response.
    """
    def __init__(self):
        self.intent_classifier = IntentClassifier()
        self.knowledge_retriever = KnowledgeRetriever()
        self.response_generator = ResponseGenerator()
        self.conversation_manager = ConversationManager()
        self.nlp_processor = NLPProcessor()

    async def process_message(self, user_message: UserMessage) -> ChatResponse:
        """
        Processes a user message and returns a comprehensive chat response.
        This method connects all the modules of the chatbot.
        """
        # 1. Process and clean the message
        processed_text = self.nlp_processor.preprocess(user_message.text)

        # 2. Classify intent
        intent_classification = await self.intent_classifier.classify(processed_text)
        intent = intent_classification.intent

        # 3. Retrieve conversation context
        context = self.conversation_manager.get_context(user_message.user_id)

        # 4. Retrieve relevant knowledge
        knowledge = await self.knowledge_retriever.retrieve(intent, processed_text, context.dict())

        # 5. Generate an appropriate response
        generated_response = await self.response_generator.generate(intent, knowledge, context.dict())

        # 6. Update conversation context
        self.conversation_manager.update_context(
            user_id=user_message.user_id,
            user_message=user_message.text,
            bot_response=generated_response.text
        )

        return ChatResponse(
            message_id=str(uuid.uuid4()),
            user_id=user_message.user_id,
            text=generated_response.text,
            intent=intent,
            confidence=generated_response.confidence,
            timestamp=datetime.now(),
            suggestions=generated_response.suggestions
        )
