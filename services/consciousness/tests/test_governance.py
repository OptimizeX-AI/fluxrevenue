import pytest
import os
import json
from ..governance.ethics_engine import EthicsEngine
from ..governance.governance_engine import GovernanceEngine
from ..governance.audit_trail import AuditTrail
from ..governance.explanation_generator import ExplanationGenerator
from ..governance.models import DecisionContext, GovernanceResponse

# --- Tests for EthicsEngine ---

@pytest.fixture
def ethics_engine():
    return EthicsEngine()

@pytest.mark.asyncio
async def test_ethics_engine_approves_safe_decision(ethics_engine):
    context = DecisionContext(
        action_name="test_action",
        parameters={},
        projected_impact="This action will improve efficiency."
    )
    judgment = await ethics_engine.evaluate_decision(context)
    assert judgment.is_ethical is True

@pytest.mark.asyncio
async def test_ethics_engine_rejects_harmful_decision(ethics_engine):
    context = DecisionContext(
        action_name="test_harm_action",
        parameters={},
        projected_impact="This action might cause financial harm."
    )
    judgment = await ethics_engine.evaluate_decision(context)
    assert judgment.is_ethical is False
    assert "DO_NO_HARM" in judgment.reason
    assert "harm" in judgment.reason

@pytest.mark.asyncio
async def test_ethics_engine_rejects_bias_decision(ethics_engine):
    context = DecisionContext(
        action_name="test_bias_action",
        parameters={},
        projected_impact="This model might create a bias against a certain group."
    )
    judgment = await ethics_engine.evaluate_decision(context)
    assert judgment.is_ethical is False
    assert "PROMOTE_FAIRNESS" in judgment.reason
    assert "bias" in judgment.reason

@pytest.mark.asyncio
async def test_ethics_engine_rejects_privacy_decision(ethics_engine):
    context = DecisionContext(
        action_name="test_privacy_action",
        parameters={},
        projected_impact="This action will expose user emails."
    )
    judgment = await ethics_engine.evaluate_decision(context)
    assert judgment.is_ethical is False
    assert "RESPECT_PRIVACY" in judgment.reason
    assert "expose" in judgment.reason

# --- Tests for GovernanceEngine ---

@pytest.fixture
def governance_engine():
    return GovernanceEngine()

@pytest.mark.asyncio
async def test_governance_engine_approves_ethical_action(governance_engine):
    context = DecisionContext(action_name="safe_action", parameters={}, projected_impact="Improves user experience.")
    response = await governance_engine.review_and_approve(context)
    assert response.approved is True

@pytest.mark.asyncio
async def test_governance_engine_rejects_unethical_action(governance_engine):
    context = DecisionContext(action_name="harm_action", parameters={}, projected_impact="Will cause definite harm.")
    response = await governance_engine.review_and_approve(context)
    assert response.approved is False
    assert "REJECTED" in response.reason

# --- Tests for AuditTrail ---

@pytest.fixture
def audit_trail():
    """
    Fixture to create an AuditTrail instance, ensuring the log file is cleaned up
    before and after the test.
    """
    log_filename = "test_audit_trail.log"
    # Reconstruct the absolute path that the AuditTrail class will use
    service_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    full_log_path = os.path.join(service_root, log_filename)

    # Ensure a clean state before the test
    if os.path.exists(full_log_path):
        os.remove(full_log_path)

    trail = AuditTrail(log_file=log_filename)
    yield trail

    # Cleanup after the test
    if os.path.exists(full_log_path):
        os.remove(full_log_path)

@pytest.mark.asyncio
async def test_audit_trail_logs_event(audit_trail):
    event_details = {"decision": "approved", "action": "test_action"}
    await audit_trail.log_conscious_event("TEST_EVENT", event_details)

    assert os.path.exists(audit_trail.log_file)
    with open(audit_trail.log_file, "r") as f:
        log_content = f.read()
        assert "TEST_EVENT" in log_content
        assert '"decision": "approved"' in log_content
        log_data = json.loads(log_content)
        assert log_data["details"] == event_details

# --- Tests for ExplanationGenerator ---

@pytest.fixture
def explanation_generator():
    return ExplanationGenerator()

@pytest.mark.asyncio
async def test_explanation_generator_for_approval(explanation_generator):
    context = DecisionContext(action_name="approve_action", parameters={}, projected_impact="Positive.")
    response = GovernanceResponse(approved=True, reason="Looks good.")
    explanation = await explanation_generator.generate_explanation(context, response)
    assert "APPROVED" in explanation
    assert "Looks good." in explanation

@pytest.mark.asyncio
async def test_explanation_generator_for_rejection(explanation_generator):
    context = DecisionContext(action_name="reject_action", parameters={}, projected_impact="Negative.")
    response = GovernanceResponse(approved=False, reason="Too risky.")
    explanation = await explanation_generator.generate_explanation(context, response)
    assert "REJECTED" in explanation
    assert "Too risky." in explanation
