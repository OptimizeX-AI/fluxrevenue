import pytest
from ..domain_orchestration_manager import DomainOrchestrationManager, topological_sort
from ..models import MultiDomainProject, Task

# --- Tests for topological_sort helper function ---

def test_topological_sort_simple():
    """Tests a simple linear dependency graph."""
    t1 = Task(task_id="1", description="Task 1")
    t2 = Task(task_id="2", description="Task 2", dependencies=["1"])
    t3 = Task(task_id="3", description="Task 3", dependencies=["2"])
    sorted_tasks = topological_sort([t3, t1, t2])
    sorted_ids = [t.task_id for t in sorted_tasks]
    assert sorted_ids == ["1", "2", "3"]

def test_topological_sort_multiple_dependencies():
    """Tests a task that depends on multiple other tasks."""
    t1 = Task(task_id="1", description="Task 1")
    t2 = Task(task_id="2", description="Task 2")
    t3 = Task(task_id="3", description="Task 3", dependencies=["1", "2"])
    sorted_tasks = topological_sort([t3, t1, t2])
    sorted_ids = [t.task_id for t in sorted_tasks]
    # t1 and t2 can come in any order, but t3 must be last
    assert sorted_ids[2] == "3"
    assert set(sorted_ids[:2]) == {"1", "2"}

def test_topological_sort_cycle_detection():
    """Tests that a cyclic dependency raises a ValueError."""
    t1 = Task(task_id="1", description="Task 1", dependencies=["3"])
    t2 = Task(task_id="2", description="Task 2", dependencies=["1"])
    t3 = Task(task_id="3", description="Task 3", dependencies=["2"])
    with pytest.raises(ValueError, match="A cyclic dependency was detected"):
        topological_sort([t1, t2, t3])

# --- Tests for DomainOrchestrationManager ---

@pytest.fixture
def orchestrator():
    """Provides a DomainOrchestrationManager instance for tests."""
    return DomainOrchestrationManager()

@pytest.mark.asyncio
async def test_analyze_domain_requirements(orchestrator):
    """Tests the domain inference logic."""
    project = MultiDomainProject(
        project_id="p1",
        project_name="Test Project",
        tasks=[
            Task(task_id="1", description="Provision a new server"),
            Task(task_id="2", description="Analyze the user dataset"),
        ]
    )
    domain_map = await orchestrator._analyze_domain_requirements(project)

    assert "infrastructure_automation" in domain_map
    assert "data_analysis" in domain_map
    assert domain_map["infrastructure_automation"][0].task_id == "1"
    assert domain_map["data_analysis"][0].task_id == "2"

@pytest.mark.asyncio
async def test_orchestrate_multi_domain_project_flow(orchestrator):
    """
    Tests the end-to-end orchestration flow with a simple multi-domain project.
    """
    project = MultiDomainProject(
        project_id="p1",
        project_name="Full Flow Test",
        tasks=[
            Task(task_id="2", description="Analyze dataset", dependencies=["1"]),
            Task(task_id="1", description="Provision server"),
        ]
    )

    result = await orchestrator.orchestrate_multi_domain_project(project)

    assert result.status == "completed"
    assert "final_status" in result.results
    assert "All tasks dispatched successfully" in result.results["final_status"]
