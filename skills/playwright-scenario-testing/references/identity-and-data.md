# Identity and Data

Authentication and test data are lifecycle dependencies. Model ownership and cleanup explicitly.

## Authentication strategy

Choose the least expensive strategy that preserves what the scenario tests:

- `none`: public behavior or tests that intentionally start unauthenticated.
- `storage-state`: ordinary authenticated scenarios where login is setup, not the behavior under test.
- `api`: establish a session or token through a supported application endpoint.
- `ui`: login UI, browser-only identity providers, or flows whose login behavior is itself under test.
- `auto`: select from verified project conventions and record the choice.

Reference credentials by environment-variable name. Never serialize passwords, tokens, cookies, or authorization headers into scenario manifests, screenshots, logs, traces intended for sharing, or generated examples.

For roles, maintain isolated state per role. Do not reuse one mutable browser context to impersonate multiple actors.

## Data lifecycle

- Prefer a fresh entity owned by the current test or worker.
- Generate collision-resistant identifiers that remain recognizable as test data.
- Create prerequisite data through a supported API or fixture when UI creation is not part of the scenario.
- Keep producer/consumer relationships explicit. Cleanup children before parents.
- Make cleanup best-effort without masking the primary test failure; report cleanup failures separately.
- Never assume a shared environment is empty or that a pre-existing record is stable.

## Parallel execution

Use one of these isolation strategies:

- test-scoped entity creation and teardown;
- worker-scoped tenant or namespace with worker cleanup;
- unique prefix plus a bounded reconciliation cleanup for orphaned data.

Shared mutable state, order-dependent tests, and global variables that hold changing product data are disallowed unless the scenario explicitly tests collaboration. Collaboration tests still use separate actors and deterministic synchronization.

## Production

Do not create, update, or delete business data in production by default. Read-only verification must avoid real customer identifiers and sensitive data. A request to mutate production requires explicit authority at the time of action and a recovery plan; configuration alone is insufficient.
