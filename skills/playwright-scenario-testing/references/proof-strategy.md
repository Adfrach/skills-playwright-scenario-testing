# Proof Strategy

Select proof layers from the behavior that must be established, not from folder names or team habit.

## Layer selection

| Evidence needed | Primary layer | Add another layer when |
|---|---|---|
| HTTP contract, authorization, validation, persistence transition | API | UI wiring or user feedback is part of the scenario |
| Navigation, browser integration, visible state, cross-page journey | E2E | server post-condition cannot be observed reliably through UI |
| Component states and interaction without full application routing | Component | real backend or browser-level integration is essential |
| Pixel-sensitive rendering | Visual | semantic behavior also needs an ordinary assertion |
| Keyboard, names, roles, focus, or accessibility tree | Accessibility | a complete audit requires an approved external analyzer |
| Configuration, generated files, or migration output | Static | runtime behavior must also be demonstrated |

API setup or cleanup does not automatically make a scenario an API test. Count API coverage only when the API behavior itself is asserted.

## Derived coverage

Add a derived case when it is adjacent to the source scenario and changes confidence materially:

- one value immediately below and above a meaningful boundary;
- one invalid representative for an input class;
- an unauthorized or wrong-role attempt when access control is relevant;
- a duplicate submission or retry where idempotency matters;
- a recoverable network/server failure when the user-facing response is specified;
- a forbidden state transition near the requested lifecycle.

Do not expand one scenario into an inventory of the whole feature. If broad exploration is requested, represent that breadth as explicit scenarios before generation.

## Risk score

Score impact and likelihood from 1 to 3, then multiply:

- 7-9: critical; execute early and include in the final gate.
- 4-6: high; automate in the current run when in scope.
- 2-3: normal; automate when it protects a stated outcome.
- 1: low; document only if automation cost is disproportionate.

Security, money movement, irreversible state changes, and privacy-sensitive behavior require explicit reasoning even when the numerical score is lower.

## Assertions

- Assert the observable contract, not incidental implementation details.
- Use retrying assertions for asynchronously rendered or eventually consistent state.
- Pair actions with the smallest sufficient outcomes. Avoid assertions that can pass before the action.
- For lists and search, identify the intended record uniquely; do not rely on row order unless order is the contract.
- For API responses, assert status semantics, relevant headers, and the minimum stable response shape. Do not snapshot secrets or volatile payloads wholesale.
