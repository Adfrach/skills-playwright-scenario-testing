# Framework Adapters

Use only after project discovery confirms the framework and the scenario requires framework-aware setup or component testing.

## React

- Reuse the application's providers and router through a mount fixture.
- Await user-visible state after asynchronous effects; do not test hook implementation details.
- Prefer accessible queries. Add a test ID only when the UI has no stable semantic identity.

## Vue

- Mount with the application's plugins, router, store, and localization through shared setup.
- Assert rendered behavior after reactive updates using Playwright assertions rather than framework-specific timing guesses.
- Treat emitted events as implementation evidence only when the component contract explicitly exposes them.

## Angular

- Reuse application providers and routing configuration.
- Prefer user-observable behavior over component internals or private services.
- Keep zone/change-detection handling inside the supported mount integration rather than adding fixed delays.

## Next.js

- Detect App Router versus Pages Router from the repository.
- Start the application through its existing development or production-like command.
- Distinguish server-rendered, client-rendered, route-handler, and browser behavior when selecting API, component, or E2E proof.
- Avoid coupling tests to generated build directories or framework-internal network requests.

## Other frameworks

Preserve the same contract: use the project's supported mount/serve mechanism, reuse providers, assert user-visible outcomes, and avoid introducing a second test architecture without a demonstrated need.

## Test IDs

Do not rewrite application markup merely to simplify generation. When a stable semantic locator is unavailable and the team permits test IDs, use a domain-oriented name that remains stable across styling and layout changes. Centralize custom test ID configuration in Playwright config.
