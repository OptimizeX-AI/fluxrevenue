import logging
import pybreaker
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

# --- Circuit Breaker ---

# Create a global breaker instance. In a real app, you might have different
# breakers for different external services.
breaker = pybreaker.CircuitBreaker(fail_max=3, reset_timeout=60)

logger.info(f"CircuitBreaker initialized: fail_max={breaker.fail_max}, reset_timeout={breaker.reset_timeout}")

# --- Retry Logic ---

# Define a retry decorator using tenacity.
# This will retry a function up to 3 times with exponential backoff,
# starting with a 1-second wait and doubling each time.
resilient_call = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    before_sleep=lambda retry_state: logger.warning(f"Retrying call, attempt {retry_state.attempt_number}...")
)
