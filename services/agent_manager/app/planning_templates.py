"""
This module contains predefined plan templates for various project types.

The templates use placeholders in their descriptions (e.g., "{features}") that
are intended to be populated by the SemanticPlanner based on the entities
extracted from the project requirements.

The dependency chains defined here are simple linear flows. As the planner's
intelligence grows, these templates can be updated to represent more complex
Direct Acyclic Graphs (DAGs).
"""

# A standard template for a project that only involves a backend API.
API_ONLY_TEMPLATE = [
    {
        "task_id": 1,
        "agent": "database_architect",
        "description": "Design database schema to support features: {features}",
        "depends_on": []
    },
    {
        "task_id": 2,
        "agent": "developer_agent",
        "description": "Develop REST API endpoints for features: {features}",
        "depends_on": [1]
    },
    {
        "task_id": 3,
        "agent": "code_reviewer",
        "description": "Perform static analysis and code review on the generated API code",
        "depends_on": [2]
    },
    {
        "task_id": 4,
        "agent": "qa_agent",
        "description": "Write integration tests for the API endpoints",
        "depends_on": [3]
    },
    {
        "task_id": 5,
        "agent": "devops_agent",
        "description": "Set up CI/CD pipeline for automated API deployment",
        "depends_on": [4]
    }
]

# A standard template for a full-stack application with a frontend and backend.
FULL_STACK_TEMPLATE = [
    {
        "task_id": 1,
        "agent": "database_architect",
        "description": "Design database schema for features: {features}",
        "depends_on": []
    },
    {
        "task_id": 2,
        "agent": "developer_agent",
        "description": "Develop REST API for features: {features}",
        "depends_on": [1]
    },
    {
        "task_id": 3,
        "agent": "developer_agent",
        "description": "Develop Frontend UI components using {technologies} to interact with the API",
        "depends_on": [2] # Frontend depends on the API contract
    },
    {
        "task_id": 4,
        "agent": "code_reviewer",
        "description": "Perform static analysis and review on all generated source code",
        "depends_on": [2, 3] # Depends on both backend and frontend code
    },
    {
        "task_id": 5,
        "agent": "qa_agent",
        "description": "Write E2E tests covering both frontend and backend",
        "depends_on": [4]
    },
    {
        "task_id": 6,
        "agent": "devops_agent",
        "description": "Set up CI/CD pipeline for full-stack application deployment",
        "depends_on": [5]
    }
]

# The main dictionary that the planner will use to select a template.
PLAN_TEMPLATES = {
    "DEFAULT": API_ONLY_TEMPLATE,
    "API_ONLY": API_ONLY_TEMPLATE,
    "FULL_STACK": FULL_STACK_TEMPLATE,
}
