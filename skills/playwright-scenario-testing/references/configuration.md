# Configuration

`playwright-scenario.config.json` is optional. Use it to record stable project choices that discovery cannot safely infer. Validate it against `schemas/config.schema.json` and with `scripts/validate-config.mjs`.

Minimal configuration:

```json
{
  "version": 1
}
```

Representative configuration using only environment-variable names:

```json
{
  "version": 1,
  "application": {
    "name": "sample-app",
    "kind": "mixed",
    "framework": "auto"
  },
  "targets": {
    "defaultEnvironment": "staging",
    "authorizedHosts": ["staging.example.invalid"],
    "environments": {
      "staging": {
        "baseUrlEnv": "TEST_BASE_URL",
        "apiBaseUrlEnv": "TEST_API_URL",
        "readOnly": false
      },
      "production": {
        "baseUrlEnv": "PRODUCTION_BASE_URL",
        "readOnly": true
      }
    }
  },
  "auth": {
    "strategy": "storage-state",
    "identityEnv": "TEST_USER",
    "passwordEnv": "TEST_PASSWORD",
    "storageStatePath": "playwright/.auth/user.json"
  },
  "execution": {
    "layerPolicy": "auto",
    "maxDiagnosticCycles": 2,
    "finalRerun": true,
    "language": "auto"
  },
  "safety": {
    "productionMutation": "deny",
    "securityMode": "safe",
    "performanceMode": "safe",
    "requireAuthorizedTarget": true,
    "requireStoppingCondition": true
  }
}
```

## Rules

- Store key names such as `TEST_PASSWORD`, never the corresponding value.
- `authorizedHosts` narrows known targets but does not replace current user authorization.
- Capability values are `auto`, `enabled`, or `disabled`. Enabling a capability does not authorize high-impact execution.
- Use paths only to override repository discovery. Prefer existing project roots.
- Keep production mutation set to `deny`; an exceptional authorized action is a runtime decision and must not be persisted as a default.
- Compatibility bounds are promises made by the package owner. Add them only after the version has been tested.
