# Observability and Recovery

Diagnose from evidence before modifying automation.

## Evidence order

1. Machine-readable test result and full error chain.
2. Trace timeline around the first divergent action.
3. DOM/accessibility snapshot and locator resolution.
4. Console errors and page exceptions.
5. Network request/response metadata with sensitive values masked.
6. Screenshot or video for visible state.
7. Relevant test, fixture, page/component object, and application contract.

Capture new evidence only when existing artifacts cannot answer the question. Avoid collecting sensitive payloads by default.

## Classification

- **Product defect**: the scenario contract is supported, automation is valid, and the application repeatedly violates it.
- **Automation defect**: locator, wait, setup, assertion, cleanup, or test architecture is incorrect.
- **Environment failure**: target, dependency, credentials, browser, data service, or infrastructure is unavailable or inconsistent.
- **Flaky behavior**: the unchanged test alternates outcome under materially identical conditions.
- **Blocked prerequisite**: required authority, contract, credential source, service, or executable is missing and cannot be inferred safely.

## Recovery loop

1. Re-run the single failure once unchanged.
2. Classify using evidence.
3. If automation is at fault, make the smallest correction that preserves the expected outcome.
4. Re-run the corrected test, then its scenario scope.
5. Any later code or data change invalidates the previous final run.

Use at most the configured diagnostic cycles, with a hard maximum of three. Repeatedly refreshing, extending timeouts, or broadening selectors without a cause is not diagnosis.

## Prohibited healing

- removing or weakening an assertion;
- adding `skip`, `fixme`, or an unconditional expected failure to hide a regression;
- accepting the first matching locator when uniqueness matters;
- replacing synchronization with a large fixed delay;
- bypassing authentication or security controls;
- changing product data or configuration outside the authorized scope.

For a confirmed product defect, preserve the assertion and create a reproducible defect record with sanitized evidence.
