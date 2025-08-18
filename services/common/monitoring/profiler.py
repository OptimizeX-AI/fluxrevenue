import cProfile
import pstats
import io
import logging
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerformanceProfiler:
    """
    A utility for profiling specific blocks of code to identify performance bottlenecks.
    Uses Python's built-in cProfile and pstats modules.
    """
    def __init__(self):
        self.profiler = cProfile.Profile()

    @contextmanager
    def profile_context(self, report_name: str, top_n: int = 10):
        """
        A context manager to profile a block of code.

        Args:
            report_name (str): A descriptive name for the profiling report.
            top_n (int): The number of top functions to show in the report, sorted by cumulative time.
        """
        logger.info(f"Starting profiling for: {report_name}")
        self.profiler.enable()

        try:
            yield
        finally:
            self.profiler.disable()
            logger.info(f"Finished profiling for: {report_name}")

            # Create a stream to capture the stats report
            s = io.StringIO()
            # Sort stats by cumulative time
            sortby = pstats.SortKey.CUMULATIVE
            ps = pstats.Stats(self.profiler, stream=s).sort_stats(sortby)

            # Print the top N functions to the stream
            ps.print_stats(top_n)

            # Log the captured stats report
            logger.info(f"--- Profiling Report for '{report_name}' ---")
            logger.info(s.getvalue())
            # Clear the profiler for the next run
            self.profiler.clear()
