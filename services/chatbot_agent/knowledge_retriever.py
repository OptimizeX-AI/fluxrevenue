from .api.models import KnowledgeContext
from typing import Dict, Any
import re

# --- Placeholder Clients ---
# In a real microservices architecture, these would be in a separate `clients`
# module and would make HTTP requests to the respective services.

class MockMemoryAgentClient:
    async def search_docs(self, query: str, context: dict) -> list[str]:
        return [f"Document found for '{query}': To implement X, first do Y..."]

class MockProjectOrchestratorClient:
    async def get_project_details(self, project_name: str) -> dict[str, Any]:
        if project_name:
            return {"name": project_name, "status": "On Track", "progress": "85%", "details": "All agents performing as expected."}
        return {"error": "Project not found."}

class MockAgentRegistryClient:
    async def get_agent_capabilities(self, agent_name: str) -> dict[str, Any]:
        if agent_name:
            return {"name": agent_name, "capabilities": ["code_generation", "testing", "review"], "status": "active"}
        return {"error": "Agent not found."}

# --- Knowledge Retriever ---

class KnowledgeRetriever:
    """
    Retrieves relevant information from various sources (other services)
    based on the user's intent.
    """
    def __init__(self):
        self.memory_client = MockMemoryAgentClient()
        self.project_client = MockProjectOrchestratorClient()
        self.agent_client = MockAgentRegistryClient()

    def _extract_entity(self, text: str, entity_keywords: list[str]) -> str | None:
        """A simple regex-based entity extractor."""
        for keyword in entity_keywords:
            # Look for the keyword followed by a potential name (e.g., "status of project [FluxRevenue]")
            match = re.search(rf"{keyword}\s+([\w-]+)", text, re.IGNORECASE)
            if match and match.group(1):
                return match.group(1)
        # Fallback for simple queries like "status of FluxRevenue"
        # This is a very basic example. A real implementation would use more robust NLP.
        tokens = text.split()
        if len(tokens) > 1:
            return tokens[-1] # Assume last word is the entity
        return None


    async def retrieve(self, intent: str, query: str, context: Dict[str, Any]) -> KnowledgeContext:
        """
        Retrieves knowledge by calling the appropriate mock client based on the intent.
        """
        knowledge = KnowledgeContext(intent=intent, query=query)

        if intent == "project_status":
            project_name = self._extract_entity(query, ["projeto", "project"]) or "FluxRevenue"
            knowledge.project_data = await self.project_client.get_project_details(project_name)

        elif intent == "technical_question":
            knowledge.technical_docs = await self.memory_client.search_docs(query, context)

        elif intent == "decision_explanation":
            # This would require a more complex query to the memory agent
            knowledge.decision_history = [f"The system chose strategy A for task '{query}' because of higher efficiency metrics."]

        elif intent == "agent_info":
            agent_name = self._extract_entity(query, ["agente", "agent"]) or "developer_agent"
            knowledge.agent_info = await self.agent_client.get_agent_capabilities(agent_name)

        return knowledge
