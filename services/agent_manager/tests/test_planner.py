import pytest
import sys
import os

# Add the 'app' directory to the Python path to allow for absolute imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.planning_model import BasicPlanner

@pytest.fixture(scope="module")
def planner():
    """Provides a single BasicPlanner instance for all tests in this module."""
    return BasicPlanner()

def test_plan_generation_has_correct_structure(planner):
    """
    Tests that every task in a generated plan has the correct keys,
    including the `depends_on` list.
    """
    requirements = "Create a backend API with a database and quality tests."
    plan = planner.generate_plan(requirements)

    assert isinstance(plan, list)
    assert len(plan) > 0, "Plan should not be empty for given requirements"

    # Check that each task has the required keys and correct types
    for task in plan:
        assert "task_id" in task and isinstance(task["task_id"], int)
        assert "agent" in task and isinstance(task["agent"], str)
        assert "description" in task and isinstance(task["description"], str)
        assert "depends_on" in task and isinstance(task["depends_on"], list)

def test_planner_creates_correct_linear_dependencies(planner):
    """
    Tests that the simple planner creates a correct linear dependency chain where
    each task depends on the previous one.
    """
    requirements = "Design a database, build an API, then write tests for quality."
    plan = planner.generate_plan(requirements)

    # The plan should have at least 3 tasks for these keywords
    assert len(plan) >= 3

    # Task 1 should have no dependencies
    task1 = next((t for t in plan if t['task_id'] == 1), None)
    assert task1 is not None
    assert task1['depends_on'] == []

    # Task 2 should depend on Task 1
    task2 = next((t for t in plan if t['task_id'] == 2), None)
    assert task2 is not None
    assert task2['depends_on'] == [1]

    # Task 3 should depend on Task 2
    task3 = next((t for t in plan if t['task_id'] == 3), None)
    assert task3 is not None
    assert task3['depends_on'] == [2]

def test_default_plan_structure_and_dependencies(planner):
    """
    Tests that the default plan generated for non-matching keywords also
    includes the correct dependency structure.
    """
    requirements = "A project with no matching keywords."
    plan = planner.generate_plan(requirements)

    assert len(plan) == 2

    task1 = plan[0]
    task2 = plan[1]

    assert task1['task_id'] == 1
    assert task1['description'] == "Define Architecture"
    assert task1['depends_on'] == []

    assert task2['task_id'] == 2
    assert task2['description'] == "Develop Backend API"
    assert task2['depends_on'] == [1]
