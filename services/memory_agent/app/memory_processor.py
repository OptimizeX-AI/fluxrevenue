import logging
from .knowledge_graph import KnowledgeGraph
from .semantic_search import SemanticSearch

logger = logging.getLogger(__name__)

def process_event_for_memory(event: dict, kg: KnowledgeGraph, search: SemanticSearch):
    """
    Processes a raw event and updates the knowledge graph and semantic search index.
    This acts as the translation layer between events and structured memory.
    """
    try:
        event_type = event.get("event_type")
        project_name = event.get("project_name")
        source_agent = event.get("source_agent")
        data = event.get("data", {})

        if not all([event_type, project_name, source_agent]):
            logger.warning("Event is missing essential fields (event_type, project_name, source_agent).")
            return

        # --- Entity and Relationship Extraction ---

        # Ensure project and agent entities exist
        kg.add_entity(project_name, "Project", {"name": project_name})
        kg.add_entity(source_agent, "Agent", {"name": source_agent})

        if event_type == "plan_generated":
            plan = data.get("plan", [])
            plan_text = "\n".join([f"Task {t.get('task_id')}: {t.get('description')}" for t in plan])

            # Index the entire plan for semantic search
            search.index_document(f"{project_name}_plan", plan_text)
            kg.add_entity(f"{project_name}_plan", "ExecutionPlan", {"full_text": plan_text})
            kg.add_relationship(source_agent, f"{project_name}_plan", "GENERATED")
            kg.add_relationship(f"{project_name}_plan", project_name, "PLAN_FOR")

        elif event_type == "task_dispatched":
            task = data.get("task", {})
            task_id = task.get("task_id")
            target_agent = task.get("agent")

            if task_id and target_agent:
                task_entity_id = f"{project_name}_task_{task_id}"
                kg.add_entity(task_entity_id, "Task", task)
                kg.add_relationship(project_name, task_entity_id, "HAS_TASK")
                kg.add_relationship(source_agent, task_entity_id, "DISPATCHED")
                kg.add_relationship(task_entity_id, target_agent, "ASSIGNED_TO")

        elif event_type == "artifacts_stored":
            task_id = data.get("task_id")
            artifacts = data.get("artifacts", [])

            if task_id:
                task_entity_id = f"{project_name}_task_{task_id}"
                for artifact in artifacts:
                    # Assuming artifact is a dict with 'name' and 'content'
                    artifact_name = artifact.get("name")
                    artifact_content = artifact.get("content")
                    if artifact_name and artifact_content:
                        artifact_entity_id = f"{project_name}_artifact_{artifact_name}"
                        kg.add_entity(artifact_entity_id, "Artifact", artifact)
                        search.index_document(artifact_entity_id, artifact_content)
                        kg.add_relationship(task_entity_id, artifact_entity_id, "PRODUCED")

        elif event_type == "project_completed":
            kg.add_entity(project_name, "Project", {"status": "completed"})
            logger.info(f"Project '{project_name}' marked as completed in Knowledge Graph.")

        else:
            # Generic event logging in KG
            event_id = f"event_{event.get('timestamp')}_{source_agent}"
            kg.add_entity(event_id, "Event", event)
            kg.add_relationship(project_name, event_id, "HAS_EVENT")


    except Exception as e:
        logger.error(f"Failed to process event for memory: {e}", exc_info=True)
