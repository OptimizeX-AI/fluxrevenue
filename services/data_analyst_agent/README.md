# Data Analyst Agent

## 1. Overview

The `DataAnalystAgent` is a specialized agent within the FluxRevenue system designed for data analysis tasks. It leverages the generic agent framework to provide capabilities for cleaning, analyzing, and visualizing data, as well as extracting actionable insights.

## 2. Domain

-   **Domain Name**: `data_analysis`

## 3. Capabilities

-   `data_cleaning`: Preprocesses datasets to handle missing or inconsistent data.
-   `statistical_analysis`: Computes key statistical metrics from a dataset.
-   `visualization`: Generates charts and graphs from data.
-   `insight_extraction`: Identifies trends and anomalies in data.
-   `report_generation`: Creates summary reports based on analysis.

## 4. Usage

This agent listens for tasks on the `data_analysis_tasks` RabbitMQ queue. Tasks should be sent with a `type` field that corresponds to one of its capabilities.

### Example Task: `analyze_dataset`

```json
{
  "type": "analyze_dataset",
  "data": {
    "dataset": [
      {"id": 1, "value": 10},
      {"id": 2, "value": 20}
    ],
    "config": {
      "threshold": 10
    }
  }
}
```

### Example Task: `create_visualization`

```json
{
  "type": "create_visualization",
  "data": {
    "dataset": [
      {"category": "A", "value": 40},
      {"category": "B", "value": 60}
    ],
    "chart_type": "pie_chart"
  }
}
```
