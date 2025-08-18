# Support Specialist Agent

## 1. Overview

The `SupportSpecialistAgent` is a specialized agent that automates technical support workflows. It is designed to handle incoming user issues, perform initial troubleshooting, provide answers from a knowledge base, and manage issue escalation.

## 2. Domain

-   **Domain Name**: `technical_support`

## 3. Capabilities

-   `issue_triage`: Categorizes and prioritizes incoming support tickets.
-   `troubleshooting`: Performs automated diagnostic steps to identify the root cause of an issue.
-   `knowledge_retrieval`: Searches a knowledge base to find articles and solutions for user questions.
-   `solution_suggestion`: Provides users with potential solutions and next steps.
-   `escalation_management`: Escalates complex issues to human support tiers when necessary.

## 4. Usage

This agent listens for tasks on the `technical_support_tasks` RabbitMQ queue.

### Example Task: `troubleshoot_issue`

```json
{
  "type": "troubleshoot_issue",
  "data": {
    "ticket_id": "TICK-789",
    "description": "Users are reporting intermittent 503 errors on the web app."
  }
}
```

### Example Task: `answer_question`

```json
{
  "type": "answer_question",
  "data": {
    "user_id": "user-abc",
    "question": "How do I configure two-factor authentication?"
  }
}
```
