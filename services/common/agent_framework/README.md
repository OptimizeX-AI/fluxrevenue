# Generic Agent Framework

## 1. Overview

This directory contains the core framework for creating, managing, and extending specialized agents within the FluxRevenue system. The goal of this framework is to provide a common structure and set of functionalities that can be leveraged to build agents for any domain, not just software development.

This allows the system to be easily extended with new capabilities, such as data analysis, infrastructure automation, technical support, and more.

## 2. Core Components

The framework consists of three main components, which are currently consolidated in `base_agent.py` due to environmental constraints during development:

### `BaseAgent`
This is an abstract base class that all specialized agents MUST inherit from. It provides a foundational set of features:
-   A standardized `__init__` method for setting agent ID and domain.
-   Common clients for interacting with the message broker, agent registry, and memory.
-   An `initialize` method that handles agent registration and starts listening for tasks.
-   An abstract `process_task` method, which must be implemented by each subclass to define its unique behavior.

### `AgentFactory`
This class is responsible for creating instances of specialized agents. It maintains a template dictionary that maps an `agent_type` string to a specific agent class. This allows for the dynamic creation of agents by other services, such as a future `DomainOrchestrator`.

### `PluginSystem`
This component allows for the runtime extensibility of agents. It can dynamically load "plugins" from a designated `/plugins` directory. Each plugin can provide additional capabilities to an agent without requiring changes to the agent's core code.

## 3. How to Create a New Agent

To create a new specialized agent, follow these steps:

**Step 1: Create a New Service Directory**
Create a new directory for your agent under `services/`, for example, `services/my_new_agent/`.

**Step 2: Define the Agent Class**
Inside your new directory, create an `agent.py` file. In this file, define your new agent class, ensuring it inherits from `BaseAgent`.

```python
# services/my_new_agent/agent.py
from ...common.agent_framework.base_agent import BaseAgent
from typing import Dict, Any

class MyNewAgent(BaseAgent):
    def __init__(self, agent_id: str, **kwargs: Any):
        # 1. Call the parent constructor with the agent's domain
        super().__init__(agent_id, "my_unique_domain")

        # 2. Define the agent's specific capabilities
        self.capabilities = [
            "capability_one",
            "capability_two",
        ]

        # 3. Initialize any domain-specific tools
        # self.my_tool = MySpecialTool()

    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        4. Implement the core logic of your agent. This method is called
           when a task is received from the message queue.
        """
        task_type = task.get("type")
        print(f"MyNewAgent received task: {task_type}")

        # Your custom logic here...

        return {"status": "completed", "result": "My agent did something!"}
```

**Step 3: Register with the AgentFactory**
Open `services/common/agent_framework/base_agent.py` and:
1.  Import your new agent class: `from ....services.my_new_agent.agent import MyNewAgent`
2.  Add it to the `agent_templates` dictionary in the `AgentFactory`'s `__init__` method:
    ```python
    self.agent_templates: Dict[str, type[BaseAgent]] = {
        "my_new_agent": MyNewAgent,
        # ... other agents
    }
    ```

Your new agent is now integrated into the framework and can be created dynamically.
