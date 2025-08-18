from .api.models import IntentClassification
import nltk
from nltk.tokenize import word_tokenize

# Download the 'punkt' tokenizer if not already present
try:
    nltk.data.find('tokenizers/punkt')
except nltk.downloader.DownloadError:
    nltk.download('punkt')

class IntentClassifier:
    """
    Classifies the user's intent based on keywords and entities using a scoring model.
    """
    def __init__(self):
        self.intents = {
            "project_status": {
                "keywords": ["status", "progresso", "andamento", "situação", "como está"],
                "entities": ["projeto", "tarefa", "trabalho"]
            },
            "technical_question": {
                "keywords": ["como", "como fazer", "tutorial", "guia", "exemplo"],
                "entities": ["código", "implementação", "desenvolvimento", "agent", "serviço"]
            },
            "decision_explanation": {
                "keywords": ["por que", "motivo", "decisão", "escolha", "porquê"],
                "entities": ["agente", "sistema", "escolheu", "fluxrevenue"]
            },
            "help_request": {
                "keywords": ["ajuda", "socorro", "problema", "erro", "não funciona"],
                "entities": ["ajuda", "suporte", "problema", "bug"]
            },
            "agent_info": {
                "keywords": ["agente", "capacidade", "função", "papel", "o que faz"],
                "entities": ["agente", "serviço", "componente"]
            },
            "greeting": {
                "keywords": ["oi", "olá", "bom dia", "boa tarde", "boa noite", "e aí"],
                "entities": []
            },
            "goodbye": {
                "keywords": ["tchau", "adeus", "até mais", "até logo", "falou"],
                "entities": []
            }
        }

    async def classify(self, text: str) -> IntentClassification:
        """
        Classifies the intent of the message using a weighted scoring model
        based on keywords and entities.
        """
        text_lower = text.lower()
        tokens = word_tokenize(text_lower)
        scores = {intent: 0.0 for intent in self.intents}

        for intent_name, intent_data in self.intents.items():
            keyword_score = sum(1 for keyword in intent_data["keywords"] if keyword in text_lower)
            entity_score = sum(1 for entity in intent_data["entities"] if entity in text_lower)
            # Weighted score
            scores[intent_name] = (keyword_score * 0.7) + (entity_score * 0.3)

        # Determine the best intent
        if not scores or all(v == 0 for v in scores.values()):
            best_intent = "general_query"
            confidence = 0.2 # Low confidence for general queries
        else:
            best_intent = max(scores, key=scores.get)
            # Normalize confidence: score divided by number of tokens, capped at 1.0
            # This is a simple heuristic and could be improved.
            raw_confidence = scores[best_intent] / len(tokens) if tokens else 0
            confidence = min(raw_confidence * 1.5, 1.0) # Scale and cap confidence

        return IntentClassification(
            intent=best_intent,
            confidence=confidence,
            scores=scores
        )
