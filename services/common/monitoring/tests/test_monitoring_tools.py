import pytest
from unittest.mock import patch, MagicMock
from ..profiler import PerformanceProfiler
from ..resource_monitor import ResourceMonitor

# --- Tests for PerformanceProfiler ---

@patch('..profiler.cProfile.Profile')
@patch('..profiler.pstats.Stats')
@patch('..profiler.logger')
def test_performance_profiler_context_manager(mock_logger, mock_pstats, mock_cprofile):
    """
    Tests that the profile_context correctly enables, disables, and logs stats.
    """
    profiler = PerformanceProfiler()

    # Mock the instances that will be created inside the context manager
    mock_profile_instance = mock_cprofile.return_value
    mock_stats_instance = mock_pstats.return_value

    with profiler.profile_context("test_report"):
        # Simulate some work being done
        pass

    # Verify that the profiler was enabled and disabled
    mock_profile_instance.enable.assert_called_once()
    mock_profile_instance.disable.assert_called_once()

    # Verify that stats were generated and logged
    mock_pstats.assert_called_once()
    mock_stats_instance.print_stats.assert_called_once()
    assert mock_logger.info.call_count >= 3 # Start, Finish, Report Header, Report Content

# --- Tests for ResourceMonitor ---

@pytest.fixture
def mock_psutil():
    """Fixture to mock the psutil library."""
    with patch('..resource_monitor.psutil') as mock_psutil_lib:
        # Configure mock return values for psutil functions
        mock_psutil_lib.cpu_percent.return_value = 50.0
        mock_psutil_lib.virtual_memory.return_value.percent = 60.0
        mock_psutil_lib.virtual_memory.return_value.used = 2 * 1024 * 1024 * 1024 # 2GB
        mock_psutil_lib.disk_usage.return_value.percent = 70.0
        yield mock_psutil_lib

def test_resource_monitor_collects_and_logs_metrics(mock_psutil):
    """
    Tests that the ResourceMonitor calls psutil and logs metrics via the mock client.
    """
    monitor = ResourceMonitor(agent_name="test_agent")

    # Mock the metrics client to check its calls
    monitor.metrics_client = MagicMock()

    monitor.collect_and_log_metrics()

    # Verify that psutil functions were called
    mock_psutil.cpu_percent.assert_called_once()
    mock_psutil.virtual_memory.assert_called_once()
    mock_psutil.disk_usage.assert_called_once()

    # Verify that metrics were "sent" via the gauge method
    assert monitor.metrics_client.gauge.call_count == 4
    monitor.metrics_client.gauge.assert_any_call(
        'agent_cpu_usage_percent', 50.0, labels={"agent": "test_agent"}
    )
    monitor.metrics_client.gauge.assert_any_call(
        'agent_memory_usage_percent', 60.0, labels={"agent": "test_agent"}
    )
    monitor.metrics_client.gauge.assert_any_call(
        'agent_disk_usage_percent', 70.0, labels={"agent": "test_agent"}
    )
    monitor.metrics_client.gauge.assert_any_call(
        'agent_memory_used_mb', 2048.0, labels={"agent": "test_agent"}
    )
