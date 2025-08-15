import spacy

class BasicPlanner:
    """
    A simple planner that uses keyword matching to generate an execution plan.
    This class serves as a placeholder for a more complex ML model.
    """
    def __init__(self):
        """
        Initializes the planner and loads the spacy language model.
        """
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # This is a fallback for environments where the model isn't pre-downloaded.
            # The Dockerfile should handle the download, but this makes it more robust.
            print("Downloading spacy model 'en_core_web_sm'...")
            from spacy.cli import download
            download("en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")

    def generate_plan(self, requirements: str) -> list:
        """
        Generates a task-based execution plan from a set of requirements.
        """
        doc = self.nlp(requirements.lower())

        plan = []
        task_id_counter = 1

        # Define keywords and corresponding tasks
        keyword_to_task = {
            ("database", "schema", "storage"): {"agent": "database_architect", "description": "Design Database Schema"},
            ("architecture", "structure"): {"agent": "code_architect", "description": "Define Core Architecture"},
            ("api", "backend"): {"agent": "developer_agent", "description": "Develop Backend API"},
            ("ui", "frontend", "interface"): {"agent": "developer_agent", "description": "Develop Frontend UI"},
            ("test", "tests", "qa"): {"agent": "qa_agent", "description": "Write E2E Tests"},
            ("review", "quality"): {"agent": "code_reviewer", "description": "Review Code & Approve"}
        }

        # The order of agents matters for a logical workflow.
        # We process them in a sensible order.
        agent_order = ["database_architect", "code_architect", "developer_agent", "qa_agent", "code_reviewer"]

        # Create a set of all tokens for efficient lookup
        tokens = {token.text for token in doc}

        # Generate plan based on keywords
        for agent in agent_order:
            for keywords, task_details in keyword_to_task.items():
                if task_details["agent"] == agent:
                    if any(keyword in tokens for keyword in keywords):
                        # Avoid adding duplicate descriptions
                        if not any(t['description'] == task_details['description'] for t in plan):
                            plan.append({
                                "task_id": task_id_counter,
                                "agent": task_details["agent"],
                                "description": task_details["description"]
                            })
                            task_id_counter += 1

        if not plan:
            # Default plan if no keywords are matched
            return [
                {"task_id": 1, "agent": "code_architect", "description": "Define Architecture"},
                {"task_id": 2, "agent": "developer_agent", "description": "Develop Backend API"},
            ]

        return plan
