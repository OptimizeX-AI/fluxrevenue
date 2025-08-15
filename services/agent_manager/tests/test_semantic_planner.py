import pytest

from services.agent_manager.app.semantic_planner import SemanticPlanner

@pytest.fixture(scope="module")
def planner():
    """Provides a single SemanticPlanner instance for all tests in this module."""
    return SemanticPlanner()

def test_semantic_planner_selects_api_template(planner):
    """
    Tests that the planner selects the API_ONLY template when backend keywords are present,
    and not frontend ones.
    """
    requirements = "I need a backend REST API using FastAPI."
    plan = planner.generate_plan(requirements)

    # Check if a task description typical for the API template is present
    assert any("Develop REST API endpoints" in task["description"] for task in plan)
    # Check that a frontend-specific task is NOT present
    assert not any("Develop Frontend UI" in task["description"] for task in plan)

def test_semantic_planner_selects_full_stack_template(planner):
    """
    Tests that the planner selects the FULL_STACK template when both frontend and backend
    keywords are present.
    """
    requirements = "Build a full stack application with a React frontend and a Python backend API."
    plan = planner.generate_plan(requirements)

    # Check for presence of both backend and frontend tasks
    assert any("Develop REST API" in task["description"] for task in plan)
    assert any("Develop Frontend UI" in task["description"] for task in plan)

def test_semantic_planner_populates_placeholders_with_entities(planner):
    """
    Tests that the planner correctly populates the placeholders in the templates
    with the specific entities extracted from the requirements.
    """
    requirements = "A full stack app with a React frontend and a FastAPI backend API, for processing payments with Stripe."
    plan = planner.generate_plan(requirements)

    # Find the backend development task
    backend_task = next((t for t in plan if "REST API" in t["description"]), None)
    assert backend_task is not None, "Backend task should be in the plan"
    # Check if the {features} placeholder was populated with "payment"
    assert "payment" in backend_task["description"]

    # Find the frontend development task
    frontend_task = next((t for t in plan if "Frontend UI" in t["description"]), None)
    assert frontend_task is not None, "Frontend task should be in the plan"
    # Check if the {technologies} placeholder was populated with "react"
    assert "react" in frontend_task["description"]

def test_semantic_planner_uses_default_placeholder_values(planner):
    """
    Tests that the planner uses default fallback values in placeholders
    when no specific entities for those placeholders are found.
    """
    requirements = "A basic API."
    plan = planner.generate_plan(requirements)

    backend_task = next((t for t in plan if "REST API" in t["description"]), None)
    assert backend_task is not None
    # Check that the default "specified features" text is present
    assert "specified features" in backend_task["description"]
