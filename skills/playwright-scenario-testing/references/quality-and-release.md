# Quality and Release

Apply this audit after generation and before the final response.

## Test audit

- The title or annotation contains exactly one scenario or derived-case ID.
- The test can fail when its expected outcome is absent.
- Locators identify user-facing meaning or an explicit stable test contract.
- Assertions wait for the intended state and cannot pass before the action.
- The test owns or deterministically references its data.
- Setup and cleanup are symmetric.
- Browser contexts, API contexts, files, and temporary resources are disposed.
- No secret, token, cookie, personal data, or production payload is persisted.
- No hidden skip, focused test, accidental `only`, or unsupported project exclusion remains.
- Generated helpers reduce real duplication and do not obscure the scenario.

## Traceability gate

Use `build-traceability.mjs` when a Playwright JSON report is available. Every in-scope scenario and derived case must be one of:

- mapped to at least one active test and executed in the final run;
- mapped to a justified manual/static proof when automation is impossible or inappropriate;
- blocked with a concrete prerequisite and no false success claim.

## Final run gate

Use `inspect-results.mjs` on the final JSON report. Completion requires:

- zero failed automation tests;
- zero flaky tests;
- zero unexpected skips;
- zero interrupted tests;
- no unmapped or unexecuted scenario IDs;
- all product defects linked to defect records with active assertions;
- cleanup completed or explicitly reported.

Expected product defects may keep the overall product outcome non-passing while the automation workflow is correctly classified. State both facts.

## Release behavior

- Do not create a commit unless the user explicitly asks for one.
- Stage only scoped paths; never stage the entire workspace blindly.
- Do not push, publish a package, create a release, or contact external systems without an explicit request.
- A license must be selected before presenting this skill package as reusable public software.
