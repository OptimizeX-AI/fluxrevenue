import spacy
import logging

logger = logging.getLogger(__name__)

class BasicPlanner:
    """
    A simple planner that uses keyword matching to generate an execution plan
    with a linear dependency graph.
    """
    def __init__(self):
        """
        Initializes the planner and loads the spacy language model.
        """
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("Spacy model 'en_core_web_sm' not found. Downloading...")
            from spacy.cli import download
            download("en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")

    def generate_plan(self, requirements: str) -> list:
        """
        Generates a task-based execution plan from a set of requirements,
        including a `depends_on` field for each task.
        """
        doc = self.nlp(requirements.lower())
        logger.info("Generating plan for requirements.", extra={"props": {"requirements_preview": requirements[:100] + "..."}})

        plan = []
        task_id_counter = 1

        keyword_to_task = {
            ("database", "schema", "storage"): {"agent": "database_architect", "description": "Design Database Schema"},
            ("architecture", "structure"): {"agent": "code_architect", "description": "Define Core Architecture"},
            ("api", "backend"): {"agent": "developer_agent", "description": "Develop Backend API"},
            ("ui", "frontend", "interface"): {"agent": "developer_agent", "description": "Develop Frontend UI"},
            ("test", "tests", "qa"): {"agent": "qa_agent", "description": "Write E2E Tests"},
            ("review", "quality"): {"agent": "code_reviewer", "description": "Review Code & Approve"}
        }

        agent_order = ["database_architect", "code_architect", "developer_agent", "qa_agent", "code_reviewer"]
        tokens = {token.text for token in doc}

        for agent in agent_order:
            for keywords, task_details in keyword_to_task.items():
                if task_details["agent"] == agent:
                    if any(keyword in tokens for keyword in keywords):
                        if not any(t['description'] == task_details['description'] for t in plan):

                            # Determine dependency: each task depends on the previously added task.
                            dependencies = [plan[-1]['task_id']] if plan else []

                            plan.append({
                                "task_id": task_id_counter,
                                "agent": task_details["agent"],
                                "description": task_details["description"],
                                "depends_on": dependencies
                            })
                            task_id_counter += 1

        if not plan:
            logger.warning("No specific keywords matched. Generating a default plan.")
            return [
                {"task_id": 1, "agent": "code_architect", "description": "Define Architecture", "depends_on": []},
                {"task_id": 2, "agent": "developer_agent", "description": "Develop Backend API", "depends_on": [1]},
            ]

        logger.info(f"Generated a plan with {len(plan)} tasks.")
        return plan
