# Common Monitoring Module

This module contains common utilities for performance profiling and resource monitoring across all FluxRevenue services.

## `profiler.py`

### `PerformanceProfiler`

This utility provides a simple way to profile specific blocks of code to identify performance bottlenecks.

**Usage:**

It's implemented as a context manager, making it easy to wrap any section of code you want to analyze.

```python
from ...common.monitoring.profiler import PerformanceProfiler

profiler = PerformanceProfiler()

def my_expensive_function():
    with profiler.profile_context("my_expensive_function_report"):
        # ... code to be profiled ...
        time.sleep(1)

```

When the `with` block is exited, a formatted report of the top functions (by cumulative time) will be logged to the console.

## `resource_monitor.py`

### `ResourceMonitor`

This utility collects and logs key system resource metrics for the service instance it's running in.

**Usage:**

Instantiate the monitor and call the collection method periodically. This is best done as a background task in the main application lifecycle.

```python
from ...common.monitoring.resource_monitor import ResourceMonitor
import asyncio

# In your main application startup (e.g., FastAPI's lifespan)
async def start_monitoring():
    resource_monitor = ResourceMonitor(agent_name="my_service_name")
    while True:
        resource_monitor.collect_and_log_metrics()
        await asyncio.sleep(60) # Log every 60 seconds

asyncio.create_task(start_monitoring())
```

The monitor uses `psutil` to collect CPU, memory, and disk usage and logs the data through a mock Prometheus client, which can be replaced with a real client for production use.
