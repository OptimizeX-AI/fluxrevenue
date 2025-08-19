from ...common.agent_framework.base_agent import BaseAgent
from typing import Dict, Any

# --- Mock Infrastructure Clients ---

class MockTerraformClient:
    async def apply(self, plan: Dict) -> str:
        resource_type = plan.get("resource_type", "vm")
        print(f"Applying Terraform plan to provision {resource_type}...")
        return "Provisioning successful. ID: tf-resource-12345"

class MockAnsibleClient:
    async def run_playbook(self, playbook: str, inventory: str) -> str:
        print(f"Running Ansible playbook '{playbook}' on inventory '{inventory}'...")
        return "Configuration applied successfully to 2 servers."

# --- Infrastructure Automation Agent ---

class InfraAutomationAgent(BaseAgent):
    """
    A specialized agent for automating infrastructure tasks.
    """
    def __init__(self, agent_id: str, **kwargs: Any):
        super().__init__(agent_id, "infrastructure_automation")
        self.capabilities = [
            "provisioning",
            "configuration_management",
            "monitoring_setup",
            "backup_automation",
            "disaster_recovery"
        ]
        self.terraform_client = MockTerraformClient()
        self.ansible_client = MockAnsibleClient()

    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes an infrastructure automation task based on its type.
        """
        task_type = task.get("type")
        print(f"InfraAutomationAgent received task: {task_type}")

        if task_type == "provision_infrastructure":
            result = await self._provision_infrastructure(task)
        elif task_type == "configure_servers":
            result = await self._configure_servers(task)
        else:
            result = {"error": f"Unsupported task type: {task_type}"}

        return {"status": "completed", "result": result}

    async def _provision_infrastructure(self, task: Dict[str, Any]) -> Dict:
        """Provisions infrastructure using a mock Terraform client."""
        plan = task.get("data", {}).get("terraform_plan", {})
        output = await self.terraform_client.apply(plan)
        return {"terraform_output": output}

    async def _configure_servers(self, task: Dict[str, Any]) -> Dict:
        """Configures servers using a mock Ansible client."""
        playbook = task.get("data", {}).get("ansible_playbook", "base_setup.yml")
        inventory = task.get("data", {}).get("inventory", "production_servers")
        output = await self.ansible_client.run_playbook(playbook, inventory)
        return {"ansible_output": output}
