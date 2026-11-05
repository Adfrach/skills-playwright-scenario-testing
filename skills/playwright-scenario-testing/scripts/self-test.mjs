#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.dirname(scriptDir);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'playwright-scenario-skill-'));

function write(relative, value) {
  const file = path.join(temp, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return file;
}

function run(script, args = [], expected = 0) {
  const result = spawnSync(process.execPath, [path.join(scriptDir, script), ...args], { encoding: 'utf8' });
  assert.equal(result.status, expected, `${script} exited ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  return result.stdout;
}

try {
  const skillText = fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');
  assert.match(skillText, /^---\r?\nname: playwright-scenario-testing\r?\n/);
  assert.match(skillText, /\ndescription: .{40,}\r?\n/);
  assert.equal(/\bTODO\b|\[TODO/i.test(skillText), false);
  JSON.parse(fs.readFileSync(path.join(skillRoot, 'schemas', 'config.schema.json'), 'utf8'));
  JSON.parse(fs.readFileSync(path.join(skillRoot, 'schemas', 'scenario.schema.json'), 'utf8'));

  const markdownFiles = [];
  function collectMarkdown(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collectMarkdown(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) markdownFiles.push(full);
    }
  }
  collectMarkdown(skillRoot);
  for (const markdownFile of markdownFiles) {
    const text = fs.readFileSync(markdownFile, 'utf8');
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^(https?:|mailto:)/i.test(target)) continue;
      assert.equal(fs.existsSync(path.resolve(path.dirname(markdownFile), target)), true, `Broken link in ${markdownFile}: ${target}`);
    }
  }
  const validConfig = write('playwright-scenario.config.json', {
    version: 1,
    targets: { environments: { test: { baseUrlEnv: 'TEST_BASE_URL', readOnly: false } } },
    auth: { strategy: 'storage-state', identityEnv: 'TEST_USER', passwordEnv: 'TEST_PASSWORD', storageStatePath: 'playwright/.auth/user.json' },
    execution: { layerPolicy: 'auto', maxDiagnosticCycles: 2, finalRerun: true, language: 'auto' },
    safety: { productionMutation: 'deny', securityMode: 'safe', performanceMode: 'safe', requireAuthorizedTarget: true, requireStoppingCondition: true }
  });
  const validResult = JSON.parse(run('validate-config.mjs', [validConfig]));
  assert.equal(validResult.valid, true);

  const invalidConfig = write('invalid-config.json', { version: 1, password: 'do-not-store-this' });
  const invalidResult = JSON.parse(run('validate-config.mjs', [invalidConfig], 1));
  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.some((error) => error.includes('secret value')));

  const scenario = write('scenario.md', `# Cart coverage

## Feature: Cart
### Scenario 1: Add one product
- scenario: SC-CART-01
- Steps:
  1. Open the product page
  2. Click Add to cart
- Expected: Cart count is 1
`);
  const manifestPath = path.join(temp, 'manifest.json');
  run('normalize-scenario.mjs', [scenario, '--output', manifestPath]);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.scenarios.length, 1);
  assert.equal(manifest.scenarios[0].id, 'SC-CART-01');
  assert.ok(manifest.scenarios[0].capabilities.includes('e2e'));

  const projectRoot = path.join(temp, 'project');
  fs.mkdirSync(path.join(projectRoot, 'tests'), { recursive: true });
  write('project/package.json', { type: 'module', scripts: { test: 'playwright test' }, devDependencies: { '@playwright/test': '^1.64.1', react: '^19.0.0' } });
  write('project/playwright.config.ts', `export default { projects: [{ name: 'chromium' }], reporter: [['json']] };\n`);
  write('project/tests/cart.spec.ts', `// fixture only\n`);
  write('project/.env', `SHOULD_NOT_BE_READ=secret\n`);
  const discovery = JSON.parse(run('discover-project.mjs', [projectRoot]));
  assert.equal(discovery.playwright.declaredVersion, '^1.64.1');
  assert.deepEqual(discovery.frameworks, ['react']);
  assert.deepEqual(discovery.paths.envFileNamesOnly, ['.env']);
  assert.equal(JSON.stringify(discovery).includes('SHOULD_NOT_BE_READ'), false);

  const report = write('report.json', {
    suites: [{
      title: 'Cart',
      specs: [{
        title: 'SC-CART-01 adds one product', file: 'tests/cart.spec.ts', tags: ['@e2e'],
        tests: [{ projectName: 'chromium', expectedStatus: 'passed', annotations: [{ type: 'scenario', description: 'SC-CART-01' }], results: [{ status: 'passed' }] }]
      }]
    }]
  });
  const traceability = JSON.parse(run('build-traceability.mjs', [manifestPath, report]));
  assert.equal(traceability.summary.mapped, 1);
  assert.equal(traceability.summary.executed, 1);

  const inspected = JSON.parse(run('inspect-results.mjs', [report]));
  assert.equal(inspected.automationGatePassed, true);
  assert.equal(inspected.productPassed, true);
  assert.equal(inspected.counts.passed, 1);

  const flakyReport = write('flaky-report.json', {
    suites: [{ specs: [{ title: 'SC-CART-01 flaky', file: 'tests/cart.spec.ts', tests: [{ projectName: 'chromium', expectedStatus: 'passed', results: [{ status: 'failed' }, { status: 'passed' }] }] }] }]
  });
  const flaky = JSON.parse(run('inspect-results.mjs', [flakyReport], 2));
  assert.equal(flaky.automationGatePassed, false);
  assert.equal(flaky.counts.flaky, 1);

  const emptyReport = write('empty-report.json', { suites: [] });
  const empty = JSON.parse(run('inspect-results.mjs', [emptyReport], 2));
  assert.equal(empty.automationGatePassed, false);
  assert.ok(empty.issues.some((issue) => issue.includes('no tests')));

  console.log(JSON.stringify({ passed: true, checks: 23, markdownFiles: markdownFiles.length }, null, 2));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
