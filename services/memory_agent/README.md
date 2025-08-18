# Memory Agent Service

## 1. Overview

The Memory Agent serves as the long-term memory and knowledge base for the entire FluxRevenue system. It is responsible for storing, indexing, and retrieving vast amounts of information from various sources, including technical documentation, past project data, and conversation histories. It provides other agents with the contextual data they need to perform their tasks effectively.

## 2. Key Components

-   **Semantic Search**: A powerful search engine that uses vector embeddings to find documents based on their semantic meaning, not just keywords.
-   **Knowledge Graph**: A structured representation of entities (like projects, agents, technologies) and their relationships, allowing for complex queries and reasoning.
-   **Embedding Engine**: The core component responsible for converting text into numerical vector representations (embeddings) for semantic understanding.
-   **File Processor**: A tool for ingesting and processing various document types (e.g., Markdown, source code) to be stored in memory.

## 3. Performance Optimizations

To ensure fast and efficient data retrieval, the `memory_agent` has been enhanced with a query caching layer.

### Query Caching

-   **Component**: `performance/query_optimizer.py`
-   **Description**: The `SemanticSearch` module now uses a `QueryOptimizer` to cache the results of expensive search queries. When a search is performed, the optimizer first checks for a cached result for that exact query. If found, the result is returned instantly, avoiding the need to re-generate embeddings and perform the similarity search. This dramatically reduces latency for repeated queries and lessens the computational load on the service. The caching is managed by the common `CacheManager`.
