#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const reportPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
const outputIndex = process.argv.indexOf('--output');
const output = outputIndex >= 0 && process.argv[outputIndex + 1] ? path.resolve(process.argv[outputIndex + 1]) : null;

if (!reportPath) {
  console.error('Usage: node inspect-results.mjs <playwright-report.json> [--output result.json]');
  process.exit(1);
}

let report;
try { report = JSON.parse(fs.readFileSync(reportPath, 'utf8')); }
catch (error) {
  console.error(JSON.stringify({ valid: false, error: error.message }, null, 2));
  process.exit(1);
}

function flatten(suites, inherited = [], out = []) {
  for (const suite of suites || []) {
    const titles = suite.title ? [...inherited, suite.title] : inherited;
    for (const spec of suite.specs || []) for (const test of spec.tests || []) {
      out.push({
        title: [...titles, spec.title].filter(Boolean).join(' > '),
        file: spec.file || suite.file || '',
        project: test.projectName || '',
        expectedStatus: test.expectedStatus || 'passed',
        annotations: test.annotations || [],
        results: test.results || []
      });
    }
    flatten(suite.suites, titles, out);
  }
  return out;
}

function classify(test) {
  if (!test.results.length) return 'notExecuted';
  const statuses = test.results.map((r) => r.status);
  const last = statuses.at(-1);
  if (last === 'interrupted') return 'interrupted';
  if (last === 'skipped') return 'skipped';
  if (last === 'passed' && statuses.some((s) => ['failed', 'timedOut'].includes(s))) return 'flaky';
  if (test.expectedStatus === 'failed' && ['failed', 'timedOut'].includes(last)) return 'productDefect';
  if (last === 'passed') return 'passed';
  if (['failed', 'timedOut'].includes(last)) return 'failedAutomation';
  return 'unknown';
}

const tests = flatten(report.suites || []);
const validReport = Array.isArray(report.suites);
const counts = { passed: 0, productDefect: 0, failedAutomation: 0, flaky: 0, skipped: 0, interrupted: 0, notExecuted: 0, unknown: 0 };
const details = [];
for (const test of tests) {
  const classification = classify(test);
  counts[classification] += 1;
  details.push({ title: test.title, file: test.file, project: test.project, classification });
}

const blocking = counts.failedAutomation + counts.flaky + counts.skipped + counts.interrupted + counts.notExecuted + counts.unknown;
const result = {
  validReport,
  automationGatePassed: validReport && tests.length > 0 && blocking === 0,
  productPassed: validReport && tests.length > 0 && blocking === 0 && counts.productDefect === 0,
  issues: [
    ...(!validReport ? ['The input is not a Playwright JSON report with a suites array.'] : []),
    ...(validReport && tests.length === 0 ? ['The report contains no tests.'] : [])
  ],
  counts: { total: tests.length, ...counts },
  blockingTests: details.filter((item) => ['failedAutomation', 'flaky', 'skipped', 'interrupted', 'notExecuted', 'unknown'].includes(item.classification)),
  productDefects: details.filter((item) => item.classification === 'productDefect')
};

const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (output) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, serialized, 'utf8');
} else process.stdout.write(serialized);

process.exit(result.automationGatePassed ? 0 : 2);
