from ...common.agent_framework.base_agent import BaseAgent
from typing import Dict, Any

# --- Mock Support Tools ---

class MockTroubleshootingEngine:
    async def diagnose(self, issue_description: str) -> Dict:
        print(f"Diagnosing issue: {issue_description}")
        if "database" in issue_description:
            return {"probable_cause": "DB connection error", "next_step": "Check DB logs"}
        return {"probable_cause": "Unknown", "next_step": "Escalate to Level 2"}

class MockKnowledgeBaseClient:
    async def search(self, query: str) -> str:
        print(f"Searching knowledge base for: {query}")
        return f"Found article 'KB-123: How to fix {query}'"

# --- Support Specialist Agent ---

class SupportSpecialistAgent(BaseAgent):
    """
    A specialized agent for handling technical support tasks.
    """
    def __init__(self, agent_id: str, **kwargs: Any):
        super().__init__(agent_id, "technical_support")
        self.capabilities = [
            "issue_triage",
            "troubleshooting",
            "knowledge_retrieval",
            "solution_suggestion",
            "escalation_management"
        ]
        self.troubleshooting_engine = MockTroubleshootingEngine()
        self.knowledge_base = MockKnowledgeBaseClient()

    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes a technical support task based on its type.
        """
        task_type = task.get("type")
        print(f"SupportSpecialistAgent received task: {task_type}")

        if task_type == "troubleshoot_issue":
            result = await self._troubleshoot_issue(task)
        elif task_type == "answer_question":
            result = await self._answer_question(task)
        else:
            result = {"error": f"Unsupported task type: {task_type}"}

        return {"status": "completed", "result": result}

    async def _troubleshoot_issue(self, task: Dict[str, Any]) -> Dict:
        """Troubleshoots a technical issue."""
        description = task.get("data", {}).get("description", "")
        diagnosis = await self.troubleshooting_engine.diagnose(description)
        return {"diagnosis": diagnosis}

    async def _answer_question(self, task: Dict[str, Any]) -> Dict:
        """Answers a question using the knowledge base."""
        question = task.get("data", {}).get("question", "")
        answer = await self.knowledge_base.search(question)
        return {"answer": answer}
