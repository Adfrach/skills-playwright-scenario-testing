# Migration Adapter

Activate only when a source Cypress or Selenium suite is in scope. Migration preserves behavior and intent; it is not a syntax translation exercise.

## Inventory

- Identify source tests, shared commands/page objects, fixtures, plugins, environment handling, CI commands, and reports.
- Map each source case to a scenario ID and classify it as migrate, merge, redesign, or retire with a reason.
- Establish a small representative slice before bulk conversion.

## Cypress sources

- Replace chained implicit subject behavior with explicit Playwright locators and assertions.
- Replace global intercepts and custom commands with narrowly scoped routes, fixtures, or helpers.
- Re-evaluate tests that depend on Cypress retry semantics, same-origin assumptions, or shared browser state.
- Do not retain arbitrary waits or selectors only because they existed in the source.

## Selenium sources

- Replace driver lifecycle and explicit polling with Playwright contexts, locators, and retrying assertions.
- Re-evaluate page objects that expose low-level element handles instead of user actions.
- Replace fragile XPath/CSS selectors with stable semantic locators where the application permits.
- Convert grid/browser capability assumptions into Playwright projects and CI strategy.

## Parity gate

For each migrated slice:

- preserve the source expected outcome or surface a product-owner decision;
- run source and target against the same authorized environment when feasible;
- compare scenario coverage and defect behavior, not line count;
- keep source tests until target tests pass the final gate and CI integration is verified;
- document retired cases and duplicate coverage.

Do not delete the source suite or switch CI ownership without an explicit request.
