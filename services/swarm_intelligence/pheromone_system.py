from collections import defaultdict
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class DigitalPheromoneSystem:
    """
    Manages the creation, evaporation, and retrieval of digital pheromones,
    which guide the agent colony towards optimal solutions.
    """
    def __init__(self):
        # Using a defaultdict is efficient for creating new paths on the fly.
        self.pheromone_matrix: Dict[str, float] = defaultdict(float)
        self.evaporation_rate: float = 0.1
        self.deposit_rate: float = 0.9

    async def deposit_pheromone(self, path: str, quality: float, agent_id: str):
        """
        Deposits a digital pheromone on a given path, with strength
        proportional to the quality of the solution found.
        """
        deposit_strength = quality * self.deposit_rate
        self.pheromone_matrix[path] += deposit_strength
        logger.debug(f"Agent {agent_id} deposited pheromone of strength {deposit_strength} on path '{path}'")

    async def evaporate_pheromones(self):
        """
        Periodically reduces the strength of all pheromone trails to prevent
        stale paths from dominating and to encourage exploration.
        """
        logger.info("Evaporating all pheromone trails...")
        for path in list(self.pheromone_matrix.keys()):
            self.pheromone_matrix[path] *= (1 - self.evaporation_rate)
            # Remove trails that have become too weak to be significant
            if self.pheromone_matrix[path] < 0.01:
                del self.pheromone_matrix[path]

    async def get_path_probabilities(self) -> Dict[str, float]:
        """
        Calculates the probability of choosing each path based on its
        pheromone strength relative to the total.
        """
        total_pheromones = sum(self.pheromone_matrix.values())
        if total_pheromones == 0:
            # If no pheromones exist, all paths have equal probability
            num_paths = len(self.pheromone_matrix)
            return {path: 1.0 / num_paths for path in self.pheromone_matrix} if num_paths > 0 else {}

        probabilities = {path: strength / total_pheromones for path, strength in self.pheromone_matrix.items()}
        return probabilities
