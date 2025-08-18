# Common Performance Module

This module contains common utilities designed to improve the performance and scalability of the FluxRevenue system.

## `cache_manager.py`

### `CacheManager`

This is the core component of the caching system. It provides a two-level (L1/L2) caching strategy to minimize latency for frequently accessed, expensive-to-compute data.

-   **L1 Cache**: A local, in-memory cache (`LocalCache`) for ultra-fast access to data within a single service instance. It has a configurable max size and TTL for its entries.

-   **L2 Cache**: A distributed Redis cache for sharing cached data across all instances of all services. It acts as a shared backend for the L1 caches.

The `CacheManager` is designed to be used by specific caching handlers (e.g., `DecisionCache` in the `agent_manager`) to abstract away the caching logic from the core business logic of the services. This keeps the service code clean and focused on its primary responsibilities.
