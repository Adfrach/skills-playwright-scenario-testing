# Project Intelligence

Use repository evidence before introducing conventions.

## Discovery order

1. Package manifest and lockfile: package manager, module system, scripts, Playwright and framework versions.
2. Playwright configuration: test roots, projects, dependencies, reporters, timeouts, web server, base URL, storage state, traces, screenshots, and video.
3. Existing tests and support code: import style, fixtures, factories, page/component objects, naming, annotations, and cleanup.
4. Environment templates: read key names from `.env.example`-style files; never print values from secret-bearing files.
5. CI and containers: commands, browser installation, artifact collection, sharding, and environment constraints.
6. Legacy test sources when migration is in scope.

Run `discover-project.mjs` as a baseline, then inspect the files it identifies. Its output is evidence, not permission to rewrite the repository.

## Version gate

- Resolve the installed version from project dependencies or the local executable.
- Check project types and official documentation before using a version-specific API.
- When a requested capability is unavailable, prefer an equivalent supported pattern. If none exists, report the compatibility requirement instead of silently changing the scenario.
- Do not upgrade Playwright, browsers, Node, or framework packages unless the user asked for an upgrade or the requested result cannot otherwise be delivered and the choice has been surfaced.

## Bootstrap

For an existing project, preserve paths and style. For an empty project, create only the minimum structure required by the scenario and requested output. Do not generate CI, Docker, reporters, multiple browsers, or a POM hierarchy speculatively.

Suggested neutral roots when no convention exists:

- `scenarios/` for source scenarios;
- `tests/e2e/`, `tests/api/`, or `tests/components/` for selected proof layers;
- `tests/support/` for fixtures, factories, and reusable helpers;
- `test-results/scenario-runs/<run-id>/` for manifests, evidence, and traceability.

## Framework signals

Use dependencies and config files rather than source-file guesses. Load the framework adapter only after a framework is confirmed. Application framework detection changes setup and component mounting; it does not change the scenario's expected outcome.
