#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const manifestPath = args[0] ? path.resolve(args[0]) : null;
const reportPath = args[1] ? path.resolve(args[1]) : null;
const outputIndex = args.indexOf('--output');
const formatIndex = args.indexOf('--format');
const output = outputIndex >= 0 ? path.resolve(args[outputIndex + 1]) : null;
const format = formatIndex >= 0 ? args[formatIndex + 1] : (output?.toLowerCase().endsWith('.md') ? 'markdown' : 'json');

if (!manifestPath || !reportPath) {
  console.error('Usage: node build-traceability.mjs <manifest.json> <playwright-report.json> [--format json|markdown] [--output file]');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

function flattenSuites(suites, inherited = [], out = []) {
  for (const suite of suites || []) {
    const titles = suite.title ? [...inherited, suite.title] : inherited;
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const annotations = (test.annotations || []).flatMap((a) => [a.type, a.description]).filter(Boolean);
        out.push({
          title: [...titles, spec.title].filter(Boolean).join(' > '),
          file: spec.file || suite.file || '',
          project: test.projectName || '',
          annotations,
          tags: spec.tags || [],
          results: test.results || [],
          expectedStatus: test.expectedStatus || 'passed'
        });
      }
    }
    flattenSuites(suite.suites, titles, out);
  }
  return out;
}

function actualStatus(test) {
  if (!test.results.length) return 'not-executed';
  const statuses = test.results.map((r) => r.status);
  const last = statuses.at(-1);
  if (last === 'passed' && statuses.some((s) => ['failed', 'timedOut'].includes(s))) return 'flaky';
  if (test.expectedStatus === 'failed' && ['failed', 'timedOut'].includes(last)) return 'product-defect';
  return last || 'unknown';
}

const tests = flattenSuites(report.suites || []);
const rows = (manifest.scenarios || []).map((scenario) => {
  const needle = scenario.id.toUpperCase();
  const matches = tests.filter((test) => [test.title, ...test.annotations, ...test.tags].join(' ').toUpperCase().includes(needle));
  return {
    scenarioId: scenario.id,
    derivedFrom: scenario.derived_from || null,
    feature: scenario.feature,
    title: scenario.title,
    mappedTests: matches.map((test) => ({ title: test.title, file: test.file, project: test.project, status: actualStatus(test) })),
    mapped: matches.length > 0,
    executed: matches.some((test) => test.results.length > 0)
  };
});

const result = {
  manifest: manifestPath,
  report: reportPath,
  summary: {
    scenarios: rows.length,
    mapped: rows.filter((row) => row.mapped).length,
    executed: rows.filter((row) => row.executed).length,
    unmapped: rows.filter((row) => !row.mapped).map((row) => row.scenarioId),
    unexecuted: rows.filter((row) => row.mapped && !row.executed).map((row) => row.scenarioId)
  },
  rows
};

let serialized;
if (format === 'markdown') {
  const lines = [
    '# Scenario Traceability', '',
    `- Scenarios: ${result.summary.scenarios}`,
    `- Mapped: ${result.summary.mapped}`,
    `- Executed: ${result.summary.executed}`,
    '', '| Scenario | Derived from | Feature | Tests | Executed |', '|---|---|---|---:|---|'
  ];
  for (const row of rows) lines.push(`| ${row.scenarioId} | ${row.derivedFrom || '-'} | ${row.feature} | ${row.mappedTests.length} | ${row.executed ? 'yes' : 'no'} |`);
  serialized = `${lines.join('\n')}\n`;
} else serialized = `${JSON.stringify(result, null, 2)}\n`;

if (output) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, serialized, 'utf8');
} else process.stdout.write(serialized);

process.exit(result.summary.unmapped.length || result.summary.unexecuted.length ? 2 : 0);
