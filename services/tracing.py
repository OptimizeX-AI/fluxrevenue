import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

def setup_tracer(service_name: str):
    """
    Configures the OpenTelemetry tracer for a given service.
    """
    resource = Resource(attributes={
        "service.name": service_name
    })

    provider = TracerProvider(resource=resource)

    # Configure the OTLP exporter to send spans to the OpenTelemetry Collector
    otlp_exporter = OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "otel-collector:4317"),
        insecure=True
    )

    processor = BatchSpanProcessor(otlp_exporter)
    provider.add_span_processor(processor)

    # Sets the global default tracer provider
    trace.set_tracer_provider(provider)

    return trace.get_tracer(__name__)
