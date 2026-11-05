# Delivery and CI Adapter

Activate for `@ci`, `@coverage`, an explicit delivery requirement, or a verified repository gap that blocks scenario execution. Do not add CI or container files merely because they are common.

## CI contract

Regardless of provider, a scenario pipeline should:

- install dependencies reproducibly from the lockfile;
- install compatible browser binaries and required OS dependencies;
- start or connect to the authorized target;
- inject secrets through the provider's secret store;
- run the intended Playwright projects and scenario scope;
- publish sanitized reports, traces, screenshots, and videos when useful;
- fail on unresolved automation results;
- retain artifacts for a bounded period.

Use provider-native caching only for safe immutable dependencies. Never cache auth state, secret-bearing environment files, or mutable test databases.

## Provider adaptation

For GitHub Actions, GitLab CI, Jenkins, CircleCI, and Azure Pipelines, preserve existing repository conventions and pin external actions/images according to the team's supply-chain policy. Generate only the provider requested or already present.

## Containers

- Match Node, Playwright, and browser versions.
- Run as a non-root user when feasible.
- Copy dependency manifests before source to support deterministic caching.
- Keep secrets out of image layers and build arguments.
- Mount or publish reports without exposing credentials.

## Projects and dependencies

Use Playwright project dependencies for setup that must complete before selected projects, such as controlled auth state. Avoid a global setup that hides per-project ownership when a dependency project is clearer. Keep API, component, and browser projects separately selectable if their environments differ.

## Sharding and parallelism

Shard only independently runnable tests. Shared accounts, global mutable data, fixed filenames, and non-isolated tenants must be resolved before increasing concurrency. Merge reports from all shards before applying the final gate.

## Coverage and reports

Collect code coverage only through supported instrumentation. Keep it distinct from scenario coverage. A CI success requires traceability and result classification, not only a process exit code or coverage threshold.
