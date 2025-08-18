from .api.models import KnowledgeContext, GeneratedResponse

class ResponseGenerator:
    """
    Generates a user-friendly response based on the retrieved knowledge and intent.
    """
    def __init__(self):
        """
        Initializes response templates. In a real system, these could be loaded
        from a configuration file or a database for easier management.
        """
        self.templates = {
            "project_status": "O projeto '{name}' está com o status '{status}' e tem {progress} de progresso. Detalhes: {details}",
            "technical_question": "Encontrei a seguinte informação que pode te ajudar: '{doc}'",
            "decision_explanation": "Analisando o histórico, aqui está o motivo da decisão: '{decision}'",
            "agent_info": "O agente '{name}' tem as seguintes capacidades: {capabilities}. Atualmente, seu status é: {status}.",
            "greeting": "Olá! Sou o assistente do FluxRevenue. Em que posso ajudar hoje?",
            "goodbye": "Até mais! Se precisar de algo, é só me chamar.",
            "help_request": "Entendido. Para obter ajuda, por favor, descreva o problema em detalhes ou contate o suporte em support@fluxrevenue.com.",
            "general_query": "Não tenho certeza de como responder a isso. Você poderia tentar reformular a pergunta de outra forma?",
            "default": "Desculpe, não entendi completamente. Poderia repetir?"
        }

    def _get_suggestions_for_intent(self, intent: str, knowledge: KnowledgeContext) -> list[str]:
        """Generates contextual suggestions based on the intent."""
        if intent == "project_status":
            return ["Ver outro projeto", "Quais agentes estão ativos?"]
        if intent == "agent_info":
            return [f"Qual o status do agente {knowledge.agent_info.get('name', '')}?", "Perguntar sobre outro agente"]
        return ["Ver status de um projeto", "Fazer uma pergunta técnica", "Ver capacidades de um agente"]

    async def generate(self, intent: str, knowledge: KnowledgeContext, context: dict) -> GeneratedResponse:
        """
        Generates a personalized response by formatting a template with the
        retrieved knowledge.
        """
        response_text = self.templates.get(intent, self.templates["default"])

        try:
            if intent == "project_status" and knowledge.project_data and "error" not in knowledge.project_data:
                response_text = response_text.format(**knowledge.project_data)
            elif intent == "technical_question" and knowledge.technical_docs:
                response_text = response_text.format(doc=knowledge.technical_docs[0])
            elif intent == "decision_explanation" and knowledge.decision_history:
                response_text = response_text.format(decision=knowledge.decision_history[0])
            elif intent == "agent_info" and knowledge.agent_info and "error" not in knowledge.agent_info:
                # Format capabilities list for better readability
                caps = ", ".join(knowledge.agent_info.get('capabilities', []))
                response_text = response_text.format(name=knowledge.agent_info.get('name'), capabilities=caps, status=knowledge.agent_info.get('status'))
        except KeyError as e:
            # Fallback if a key is missing in the template data
            response_text = self.templates["default"]
            print(f"Template formatting error for intent '{intent}': Missing key {e}")

        suggestions = self._get_suggestions_for_intent(intent, knowledge)

        return GeneratedResponse(
            text=response_text,
            confidence=0.95,  # Confidence is high as we are generating from specific data
            suggestions=suggestions,
        )
