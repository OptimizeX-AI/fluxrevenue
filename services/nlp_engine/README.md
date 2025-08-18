# Advanced NLP Engine Service

## 1. Overview

The `Advanced NLP Engine` is a specialized service that provides sophisticated natural language understanding and generation capabilities to the FluxRevenue system. It is designed to process complex user queries and generate high-quality, structured content like technical documentation.

This service moves beyond simple intent classification and provides a deeper, more nuanced understanding of language.

## 2. Architecture

The service is composed of two main engines:

### `AdvancedNLPEngine`
This engine focuses on **understanding** language. It orchestrates several components:
-   **Intent Analyzer**: Detects multiple, potentially overlapping intents within a single query.
-   **Entity Extractor**: Identifies and categorizes complex entities.
-   **Sentiment Analyzer**: Determines the sentiment and tone of the text.
-   **Context Manager**: Processes conversational history to better understand the query in context.

### `AdvancedContentGenerator`
This engine focuses on **generating** language. Its workflow includes:
-   **Knowledge Retrieval**: Gathers facts and information from a knowledge base.
-   **Content Structuring**: Creates a logical outline for the content to be generated.
-   **Draft Generation**: Uses an advanced model to write the initial draft.
-   **Fact Checking**: Verifies the accuracy of the generated content.
-   **Style Transfer**: Adapts the writing style to suit the target audience and desired depth.

## 3. API

The service exposes two main endpoints:

-   `POST /understand-query`: Takes a string query and optional context, and returns a rich `SemanticUnderstanding` object with intents, entities, sentiment, and more.
-   `POST /generate-documentation`: Takes a configuration object specifying a topic, audience, and depth, and returns a fully generated string of technical documentation in Markdown format.

For more details, see the auto-generated API documentation at `/docs`.

## 4. Getting Started

The service is containerized and can be run using Docker Compose.

```bash
docker-compose up --build nlp_engine
```

The service will be available on port `8015` on the host machine.
