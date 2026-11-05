# Playwright Scenario Testing

`playwright-scenario-testing` is a standalone Codex skill that turns user scenarios into verified Playwright coverage through one workflow:

```text
Scenario -> Normalize -> Discover -> Design -> Generate -> Execute -> Diagnose -> Verify
```

It supports scenario-driven UI, API, component, accessibility, visual, migration, CI, security, and performance testing. Capabilities are loaded only when the scenario and repository require them.

## Install

This repository is private. Authenticate with an account that has access before installing.

### GitHub CLI

Install for the current user:

```powershell
gh auth login
gh skill install Adfrach/skills-playwright-scenario-testing playwright-scenario-testing --agent codex --scope user
```

Use `--scope project` instead of `--scope user` to install only for the current project. Start a new Codex session after installation.

### Codex skill installer

Windows PowerShell:

```powershell
python "$env:USERPROFILE\.codex\skills\.system\skill-installer\scripts\install-skill-from-github.py" `
  --repo Adfrach/skills-playwright-scenario-testing `
  --path skills/playwright-scenario-testing `
  --ref v0.1.0
```

The installer uses existing Git credentials or `GH_TOKEN`/`GITHUB_TOKEN` for private repository access. Never commit a token to this repository.

## Use

Invoke the skill explicitly with a scenario:

```text
Gunakan $playwright-scenario-testing untuk menguji skenario berikut:
Sebagai pengguna terdaftar, saya dapat masuk dan melihat dashboard akun saya.
```

The skill may also activate automatically when a request clearly asks for a scenario-based Playwright test outcome.

## Configuration

Project-level configuration is optional. When needed, create `playwright-scenario.config.json` in the target application repository. Store environment-variable names in configuration, never secret values.

Resolution order is:

```text
User instruction -> validated config -> repository discovery -> safe default
```

## Validate this package

From the repository root:

```powershell
node skills/playwright-scenario-testing/scripts/self-test.mjs
```

## Safety

The skill operates only on targets the user owns or is authorized to test. Production is read-only by default. Destructive probes, load, fuzzing, production mutation, and other risky actions require explicit authorization and a defined stopping condition.

## License

MIT License. See [LICENSE](LICENSE).
