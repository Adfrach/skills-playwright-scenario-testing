# Scenario Pipeline

This is the only public workflow. Keep its phases visible in the run manifest so work can resume without replaying completed side effects.

## 1. Normalize

- Accept a scenario from chat, Markdown, or normalized JSON.
- Preserve the user's objective and expected outcomes. Separate observed facts, user requirements, and agent assumptions.
- Create stable scenario IDs when absent. A derived negative or boundary case must use its own ID and set `derived_from`.
- Resolve placeholders at execution time. Do not store credentials or tokens in the manifest.
- Score risk using impact and likelihood from 1 to 3. The score prioritizes work; it does not authorize broader testing.

Stop and ask only when an ambiguity changes the product expectation, authorization boundary, or destructive effect. Record harmless normalization assumptions and continue.

## 2. Discover

- Run project discovery before choosing files, syntax, commands, frameworks, or Playwright APIs.
- Inspect existing config, tests, fixtures, helpers, package scripts, reporters, CI, and application framework.
- Verify the target and environment. Treat a target as production when evidence is ambiguous and mutation would matter.
- Explore the exact scenario path. Capture user-visible behavior plus relevant console and network observations.
- Mark an endpoint, selector, validation, or state transition as observed only when supported by live behavior or repository evidence.

## 3. Design

- Choose the lowest-cost proof that demonstrates the scenario without losing the user-visible contract.
- Add derived cases only for a nearby boundary, negative path, authorization rule, or failure state that materially protects the scenario.
- Keep each test independently runnable. Identify its setup, owned data, cleanup, expected outcome, and proof layer.
- For multi-feature scenarios, model producer/consumer data and reverse-order cleanup.

## 4. Generate

- Preserve repository conventions unless they conflict with correctness or safety.
- Extend existing fixtures and abstractions before adding parallel ones.
- Use inline actions for one-off flows, a helper for reusable technical behavior, a fixture for lifecycle-managed dependencies, and a page/component object for stable domain-facing interaction reused across tests.
- Put the scenario ID in the test title or annotation so reports can be traced deterministically.
- Keep assertions active for known defects; annotate or report the defect instead of weakening the test.

## 5. Execute

- List or discover tests before the scoped run when the project supports it.
- Run the smallest complete scope that proves the changed scenarios, then run the configured final scope without a grep that could hide sibling cases.
- Read machine-readable output. A command exit code alone does not establish coverage or classification.

## 6. Diagnose

- Re-run a failing test once unchanged to distinguish a consistent failure from an intermittent one.
- Inspect evidence before editing: error, trace, locator state, console, network, screenshot, and relevant source.
- Classify the cause as product defect, automation defect, environment failure, flaky behavior, or blocked prerequisite.
- Limit diagnosis to the configured cycle count. If the same blocker persists, report it with evidence rather than looping.

## 7. Verify

Completion requires:

- every scenario and derived case has an active automation mapping or a justified non-automated proof;
- all mapped tests were discovered and executed in the final run;
- no unresolved automation error, unexpected skip, interruption, flake, or unclassified result remains;
- created data was cleaned up or its retained ownership is explicit;
- evidence is sanitized;
- product defects retain their failing assertion and defect reference.

Commit and push are not completion conditions. Never perform either without an explicit request.
