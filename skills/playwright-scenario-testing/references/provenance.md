# Provenance and Independent Authorship

This package is independently authored. It must remain usable without third-party skill packs.

## Maintenance method

For each technical update:

1. Start from a user outcome or failing fixture, not another skill's wording or layout.
2. Consult primary documentation and installed type definitions.
3. Write the smallest decision rule that changes behavior.
4. Create a new neutral example only when a rule cannot be understood without one.
5. Verify the behavior in a disposable fixture.
6. Record the source URL, verification date, Playwright version, and affected reference below.
7. Run `node scripts/audit-similarity.mjs <skill-path> <comparison-corpus>` when a comparison corpus is available. Ignore unavoidable API names; rewrite distinctive prose or examples.

Similarity review supports independent authorship but is not legal advice or a substitute for license review.

## Verification ledger

| Verified | Version/context | Primary source | Used for |
|---|---|---|---|
| 2026-11-05 | Playwright documentation current on date | https://playwright.dev/docs/best-practices | observable behavior, isolation, resilient authoring |
| 2026-11-05 | Playwright documentation current on date | https://playwright.dev/docs/api-testing | API proof, setup, and post-condition strategy |
| 2026-11-05 | Playwright documentation current on date | https://playwright.dev/docs/trace-viewer | trace-led diagnosis |
| 2026-11-05 | Playwright documentation current on date | https://playwright.dev/docs/locators | locator behavior and auto-waiting |
| 2026-11-05 | Playwright documentation current on date | https://playwright.dev/docs/test-assertions | retrying and generic assertions |
| 2026-11-05 | Playwright documentation current on date | https://playwright.dev/docs/auth | isolated authenticated state |
| 2026-11-05 | Playwright documentation current on date | https://playwright.dev/docs/test-fixtures | fixture lifecycle and isolation |
| 2026-11-05 | Playwright documentation current on date | https://playwright.dev/docs/test-components | component proof strategy |
| 2026-11-05 | Playwright documentation current on date | https://playwright.dev/docs/accessibility-testing | accessibility checks and limitations |
| 2026-11-05 | Playwright documentation current on date | https://playwright.dev/docs/ci | CI environment and browser installation |
| 2026-11-05 | Playwright documentation current on date | https://playwright.dev/docs/test-sharding | independent distributed execution |
| 2026-11-05 | Local project `@playwright/test` 1.64.1 | installed package and types | initial script and compatibility validation |

The package is distributed under the MIT License selected by the owner. Re-run the independent-authorship review before each release.
