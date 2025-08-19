import pytest
from unittest.mock import AsyncMock, patch
from ..pheromone_system import DigitalPheromoneSystem
from ..ant_colony import AgentColony
from ..models import ComplexProblem, Solution

# --- Tests for DigitalPheromoneSystem ---

@pytest.mark.asyncio
async def test_pheromone_deposit_and_evaporation():
    """Tests the core deposit and evaporation logic."""
    ps = DigitalPheromoneSystem()
    ps.evaporation_rate = 0.1

    await ps.deposit_pheromone("path1", quality=0.8, agent_id="ant1")
    assert ps.pheromone_matrix["path1"] == 0.8 * ps.deposit_rate # 0.72

    await ps.evaporate_pheromones()
    assert ps.pheromone_matrix["path1"] == pytest.approx(0.72 * 0.9) # 0.648

@pytest.mark.asyncio
async def test_get_path_probabilities():
    """Tests the probability calculation."""
    ps = DigitalPheromoneSystem()
    await ps.deposit_pheromone("path1", 1.0, "ant1") # Strength = 0.9
    await ps.deposit_pheromone("path2", 1.0, "ant2") # Strength = 0.9

    probs = await ps.get_path_probabilities()
    assert probs["path1"] == pytest.approx(0.5)
    assert probs["path2"] == pytest.approx(0.5)

# --- Tests for AgentColony ---

@pytest.fixture
def agent_colony():
    """Provides an AgentColony instance with mocked components."""
    colony = AgentColony(colony_size=10, iterations=5)
    # Mock the internal components to test orchestration
    colony._initialize_colony = AsyncMock()
    colony._check_convergence = AsyncMock(return_value=False)
    colony._synthesize_optimal_solution = AsyncMock(return_value=Solution(agent_id="best_ant", path=[], quality=1.0))
    # Mock the solution evaluator to return what it's given
    colony.solution_evaluator.evaluate = AsyncMock(side_effect=lambda s: s)
    return colony

@pytest.mark.asyncio
async def test_agent_colony_solve_problem_loop(agent_colony):
    """
    Tests that the main `solve_complex_problem` loop runs for the
    specified number of iterations and calls its components correctly.
    """
    problem = ComplexProblem(problem_id="p1", domain="test_domain", description="desc")

    # We need to patch the MockSpecializedAgent's explore_solution method
    with patch('..ant_colony.MockSpecializedAgent.explore_solution', new_callable=AsyncMock) as mock_explore:
        mock_explore.return_value = Solution(agent_id="test", path=("a", "b"), quality=0.8)

        await agent_colony.solve_complex_problem(problem)

    # Assert that the main loop ran for the correct number of iterations
    assert agent_colony.solution_evaluator.evaluate.call_count == 5

    # Assert that pheromones were deposited and evaporated in each iteration
    # Since deposit is per agent, it's colony_size * iterations
    # But since we can't easily mock the method on the instance within the list comprehension,
    # we can check evaporation instead, which is called once per loop.
    assert agent_colony.pheromone_system.evaporate_pheromones.call_count == 5

    # Assert the final synthesis was called
    agent_colony._synthesize_optimal_solution.assert_called_once()
