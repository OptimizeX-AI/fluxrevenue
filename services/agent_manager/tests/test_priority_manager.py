import pytest
from ..app.priority_manager import PriorityManager

@pytest.fixture
def manager():
    """Provides a PriorityManager instance for testing."""
    return PriorityManager()

def test_calculates_default_priority(manager):
    """Tests that a task with no keywords gets the default priority."""
    task = {"description": "A standard task with no special keywords."}
    assert manager.calculate_priority(task) == 5

def test_calculates_high_priority_for_critical_security_task(manager):
    """Tests that keywords for urgency and impact create a high priority score."""
    task = {"description": "Fix a critical security vulnerability."}
    # Expected: Base(5) + fix(8) + critical(15) + security(20) = 48
    assert manager.calculate_priority(task) == 48

def test_calculates_lower_priority_for_simple_ui_task(manager):
    """Tests that a simple UI task gets a lower score, including negative modifiers."""
    task = {"description": "A simple UI adjustment."}
    # Expected: Base(5) + ui(5) + simple(-2) = 8
    assert manager.calculate_priority(task) == 8

def test_calculates_combined_score_correctly(manager):
    """Tests that multiple keywords from different categories are combined correctly."""
    task = {"description": "An urgent and complex refactor of the database."}
    # Expected: Base(5) + urgent(10) + complex(5) + refactor(7) + database(12) = 39
    assert manager.calculate_priority(task) == 39

def test_priority_is_capped_at_100(manager):
    """Tests that the priority score does not exceed the maximum cap of 100."""
    # We can temporarily modify the rules on the instance for this test
    manager.priority_rules["urgency_keywords"]["critical"] = 150
    task = {"description": "A critical task."}
    assert manager.calculate_priority(task) == 100

def test_priority_has_minimum_of_1(manager):
    """Tests that the priority score does not go below the minimum of 1."""
    # Modify rules to force a negative score
    manager.priority_rules["complexity_modifiers"]["simple"] = -20
    task = {"description": "A very simple task"}
    # Expected: Base(5) + simple(-20) = -15, which should be capped at 1.
    assert manager.calculate_priority(task) == 1
