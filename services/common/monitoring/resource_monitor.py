import psutil
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MockPrometheusClient:
    """
    A mock client to simulate sending metrics to a Prometheus Pushgateway or similar.
    In a real system, this would be replaced with the official prometheus_client library.
    """
    def gauge(self, name: str, value: float, labels: dict = None):
        label_str = ", ".join([f'{k}="{v}"' for k, v in labels.items()]) if labels else ""
        logger.info(f"[Prometheus METRIC] {name}{{{label_str}}}: {value}")

class ResourceMonitor:
    """
    A utility for monitoring system resources like CPU, memory, and disk usage.
    """
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        # In a real system, this would be an actual Prometheus client.
        self.metrics_client = MockPrometheusClient()

    def collect_and_log_metrics(self):
        """
        Collects all relevant system metrics and logs them.
        In a real system, this would push them to a monitoring service.
        """
        try:
            # CPU Usage
            cpu_percent = psutil.cpu_percent(interval=1)
            self.metrics_client.gauge(
                'agent_cpu_usage_percent',
                cpu_percent,
                labels={"agent": self.agent_name}
            )

            # Memory Usage
            memory_info = psutil.virtual_memory()
            self.metrics_client.gauge(
                'agent_memory_usage_percent',
                memory_info.percent,
                labels={"agent": self.agent_name}
            )
            self.metrics_client.gauge(
                'agent_memory_used_mb',
                memory_info.used / (1024 * 1024),
                labels={"agent": self.agent_name}
            )

            # Disk Usage
            disk_usage = psutil.disk_usage('/')
            self.metrics_client.gauge(
                'agent_disk_usage_percent',
                disk_usage.percent,
                labels={"agent": self.agent_name}
            )
        except Exception as e:
            logger.error(f"Error collecting resource metrics for agent '{self.agent_name}': {e}")
