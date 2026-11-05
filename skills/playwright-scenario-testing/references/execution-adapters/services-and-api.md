# Services and API Adapters

Use this adapter when the scenario requires HTTP evidence, direct state setup, post-condition verification, or controlled service substitution.

## Contract discovery

Establish endpoints from one or more of:

- observed browser network traffic;
- OpenAPI or another maintained contract;
- application route/client code;
- an existing verified API test or fixture.

Source hints alone are hypotheses. Confirm method, path, authentication, request shape, response semantics, and side effects before generating assertions.

## API proof

- Use an isolated API request context with the correct base URL and approved authentication.
- Assert the expected status class or exact status when it is part of the contract.
- Validate stable headers and the minimum response fields needed by the scenario.
- Verify persistence or state transitions with a follow-up read when the response alone is insufficient.
- Dispose request contexts and remove data created by the test.

## UI setup and post-conditions

API setup is appropriate when it creates prerequisite state faster and more reliably than the UI, and the creation UI is not under test. A browser action can be followed by an API read to prove server state. Keep setup/post-condition calls visually distinct from API tests in reporting.

## Negative and authorization cases

Cover malformed shape, missing required data, invalid value classes, missing identity, wrong role, stale version, duplicate request, and forbidden transition only when relevant to the source scenario. Avoid broad fuzzing in ordinary functional mode.

## Network observation

- Start listeners before the user action.
- Match by method and stable URL components, not transient IDs alone.
- Sanitize headers, cookies, query parameters, and payload fields before evidence storage.
- Do not assert every incidental background request.

## Mocking and substitution

Mock only when the scenario needs a controlled external dependency, rare failure, deterministic clock/data, or unavailable service. Prefer testing the application's own API normally. Record what was substituted so the result is not mistaken for full integration proof.

For a mock:

- keep the request matcher narrow;
- validate the request before fulfilling;
- return a contract-realistic response;
- remove the route after the test;
- include at least one non-mocked path when integration is part of the risk.

## GraphQL and realtime services

For GraphQL, identify the operation and relevant variables rather than matching only the shared endpoint. Assert GraphQL errors separately from HTTP status. For WebSocket or server-sent events, prefer observable application state; inspect messages only when the transport contract is the scenario.

## Third-party services

Do not send synthetic transactions, emails, payments, or messages to real third parties without explicit authorization. Use vendor-provided sandbox/test modes or a controlled substitute. Never capture real customer payloads as fixtures.
