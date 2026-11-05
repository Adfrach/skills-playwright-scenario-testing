# Nonfunctional and Specialized Adapters

These capabilities are scenario-gated. Functional correctness remains the prerequisite for interpreting their results.

## Component testing

- Confirm the project's supported component test integration and mount contract.
- Reuse application providers, routing, state, and styling through a project fixture.
- Test component behavior and states that do not require a full deployed application.
- Escalate to E2E when browser navigation, backend integration, or cross-page behavior is essential.

## Performance

Default safe mode permits a small, bounded measurement that resembles one ordinary user and has a written stopping condition. Measure an explicit outcome such as navigation timing, interaction duration, API latency, or rendering budget.

Do not use Playwright workers as an undisclosed load-testing system. Sustained concurrency, stress, soak, or capacity claims require an approved non-production target, explicit opt-in, and a purpose-built load tool. Separate browser overhead from server latency and report sample size plus environment.

## Security

Default safe mode covers observable security behavior relevant to the scenario:

- access control and role separation;
- secure cookie properties and expected redirect behavior;
- absence of secrets in visible output, URLs, logs, or storage;
- safe handling of ordinary invalid input;
- browser security headers as passive observations.

Exploit payloads, fuzzing, privilege escalation attempts, broad endpoint probing, destructive inputs, or bypass testing require explicit authorization, a non-production target, and a narrow stopping condition. Do not claim a security audit from scenario tests.

## Visual and accessibility audit boundaries

Visual comparison proves rendering similarity under a controlled environment, not usability. Automated accessibility tooling finds a subset of issues, not conformance. Report the exact checks performed and keep scenario-level semantic assertions.

## Coverage

Code coverage is diagnostic. Collect it only when the project exposes a supported instrumentation path. Do not equate a percentage with scenario coverage. Report scenario traceability and code coverage separately.

## Internationalization

Use at least one locale that changes formatting and, when relevant, a right-to-left locale. Assert translated semantics through stable roles or test contracts, not fragile full-page text snapshots. Control timezone independently from locale.

## Specialized application surfaces

- For browser extensions, use isolated test profiles and verify permissions/host access declared by the extension.
- For Electron, distinguish renderer behavior from main-process integration.
- For service workers and PWAs, test installation/update/offline transitions with clean contexts.
- For canvas/WebGL, prefer exported state and targeted screenshots over coordinate-only interaction.

## Reporting

Every nonfunctional result must state environment, configuration, sample or baseline, threshold source, limitations, and whether the result is a pass, observation, or blocked measurement.
