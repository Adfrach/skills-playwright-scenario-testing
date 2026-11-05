#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const input = args[0] ? path.resolve(args[0]) : null;
const outputIndex = args.indexOf('--output');
const output = outputIndex >= 0 && args[outputIndex + 1] ? path.resolve(args[outputIndex + 1]) : null;

if (!input || !fs.existsSync(input)) {
  console.error('Usage: node normalize-scenario.mjs <scenario.md|scenario.json> [--output manifest.json]');
  process.exit(1);
}

function slug(value) {
  return value.normalize('NFKD').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase() || 'SCENARIO';
}

function runId() {
  const now = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `scenario_${now}_${crypto.randomBytes(2).toString('hex')}`;
}

function listValue(line) {
  return line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s*)/, '').trim();
}

function detectLanguage(text) {
  const idHits = (text.match(/\b(fitur|skenario|langkah|hasil|diharapkan|pengguna|masuk|keluar|pergi|halaman|pastikan|berhasil|gunakan|kata sandi)\b/gi) || []).length;
  return idHits >= 2 ? 'id' : 'en';
}

const capabilityRules = [
  ['api', /\b(api|endpoint|http|request|response|graphql|rest)\b/i],
  ['component', /@component\b|\bcomponent test/i],
  ['visual', /@visual\b|\b(screenshot|pixel|visual|layout)\b/i],
  ['accessibility', /@a11y\b|@accessibility\b|\b(accessibility|keyboard|screen reader|aria)\b/i],
  ['mobile', /@mobile\b|\b(mobile|responsive|viewport|touch)\b/i],
  ['i18n', /@i18n\b|\b(locale|translation|rtl|language)\b/i],
  ['files', /\b(upload|download|attachment|unggah|unduh|berkas)\b/i],
  ['multi-context', /\b(popup|new tab|multi[- ]?tab|multiple users?)\b/i],
  ['frames', /\b(iframe|frame|shadow dom)\b/i],
  ['clock', /\b(timezone|clock|date|expiry|expires|midnight)\b/i],
  ['network', /\b(network|offline|mock|intercept)\b/i],
  ['realtime', /\b(websocket|real[- ]?time|live update|server.sent)\b/i],
  ['canvas', /\b(canvas|webgl)\b/i],
  ['electron', /@electron\b|\belectron\b/i],
  ['extension', /@extension\b|\bbrowser extension\b/i],
  ['webmcp', /@webmcp\b|\bwebmcp\b/i],
  ['multi-user', /\b(collaboration|multi[- ]?user|second user|another user)\b/i],
  ['migration', /@migration\b|\b(cypress|selenium)\b/i],
  ['ci', /@ci\b|\b(github actions|gitlab ci|jenkins|circleci|azure pipeline)\b/i],
  ['coverage', /@coverage\b|\bcode coverage\b/i],
  ['security', /@security\b|\b(security|authorization|permission|role|xss|csrf|captcha|authentication|credential)\b/i],
  ['performance', /@performance\b|\b(performance|latency|load|response time)\b/i]
];

function inferCapabilities(text) {
  const capabilities = capabilityRules.filter(([, rule]) => rule.test(text)).map(([name]) => name);
  if (!capabilities.includes('api') || /\b(page|button|form|click|screen|browser|navigate|visible|display|halaman|tombol|klik|navigasi|terlihat|dashboard)\b/i.test(text)) capabilities.push('e2e');
  return [...new Set(capabilities)];
}

function proofLayers(capabilities) {
  const layers = [];
  if (capabilities.includes('api')) layers.push('api');
  if (capabilities.includes('component')) layers.push('component');
  if (capabilities.includes('e2e')) layers.push('e2e');
  if (capabilities.includes('visual')) layers.push('visual');
  if (capabilities.includes('accessibility')) layers.push('accessibility');
  if (capabilities.includes('migration') || capabilities.includes('ci') || capabilities.includes('coverage')) layers.push('static');
  return [...new Set(layers.length ? layers : ['e2e'])];
}

function parseMarkdown(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const scenarios = [];
  let feature = 'General';
  let current = null;
  let section = '';
  let h1 = '';

  function finish() {
    if (!current) return;
    const fullText = [current.title, ...current.steps.map((s) => s.action), ...current.expected, ...current.tags].join(' ');
    current.id ||= `SC-${slug(feature).slice(0, 16)}-${String(scenarios.length + 1).padStart(2, '0')}`;
    current.objective ||= current.title;
    if (current.steps.length === 0) current.steps.push({ id: '1', action: current.objective });
    if (current.expected.length === 0) current.expected.push(`Outcome described by scenario: ${current.title}`);
    current.steps = current.steps.map((step, index) => ({ ...step, id: String(index + 1) }));
    current.capabilities = inferCapabilities(fullText);
    current.proof_layers = proofLayers(current.capabilities);
    current.risk = { impact: 2, likelihood: 2, score: 4, priority: 'high' };
    current.status = 'planned';
    const placeholders = [...fullText.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((m) => m[1]);
    current.test_data = Object.fromEntries([...new Set(placeholders)].map((key) => [key, `{${key}}`]));
    scenarios.push(current);
    current = null;
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const titleMatch = line.match(/^#\s+(.+)$/);
    if (titleMatch && !line.startsWith('##')) { h1 = titleMatch[1].trim(); continue; }
    const featureMatch = line.match(/^##\s+(?:(?:Feature|Fitur)\s*:\s*)?(.+)$/i);
    if (featureMatch && !/^##\s+(steps?|langkah|expected|hasil|preconditions?|prasyarat)/i.test(line)) {
      finish(); feature = featureMatch[1].trim(); section = ''; continue;
    }
    const scenarioMatch = line.match(/^###\s+(?:(?:Scenario|Skenario)(?:\s+\d+)?\s*:\s*)?(.+)$/i);
    if (scenarioMatch) {
      finish();
      current = { id: '', feature, title: scenarioMatch[1].trim(), objective: '', actors: [], preconditions: [], steps: [], expected: [], cleanup: [], tags: [], derived_from: null };
      section = '';
      continue;
    }
    if (!current) continue;
    const idMatch = line.match(/^[-*]?\s*(?:scenario|id)\s*:\s*([A-Za-z0-9._-]+)/i);
    if (idMatch) { current.id = idMatch[1].toUpperCase(); continue; }
    const inlineExpected = line.match(/^[-*]?\s*(?:expected|hasil(?: yang diharapkan)?)\s*:\s*(.+)$/i);
    if (inlineExpected) { current.expected.push(inlineExpected[1].trim()); section = 'expected'; continue; }
    const sectionMatch = line.match(/^[-*]?\s*(steps?|langkah|preconditions?|prasyarat|actors?|aktor|cleanup|tags?)\s*:\s*(.*)$/i);
    if (sectionMatch) {
      const key = sectionMatch[1].toLowerCase();
      section = /step|langkah/.test(key) ? 'steps' : /precondition|prasyarat/.test(key) ? 'preconditions' : /actor|aktor/.test(key) ? 'actors' : /cleanup/.test(key) ? 'cleanup' : 'tags';
      if (sectionMatch[2]) {
        const value = sectionMatch[2].trim();
        if (section === 'steps') current.steps.push({ id: '', action: value });
        else if (section === 'tags') current.tags.push(...(value.match(/@[A-Za-z0-9_-]+/g) || []));
        else current[section].push(value);
      }
      continue;
    }
    if (/^\s*(?:[-*+]\s+|\d+[.)]\s*)/.test(raw)) {
      const value = listValue(raw);
      if (section === 'steps') current.steps.push({ id: '', action: value });
      else if (section === 'expected') current.expected.push(value.replace(/^expect\s*:\s*/i, ''));
      else if (['preconditions', 'actors', 'cleanup'].includes(section)) current[section].push(value);
      else if (section === 'tags') current.tags.push(...(value.match(/@[A-Za-z0-9_-]+/g) || []));
    }
  }
  finish();

  if (scenarios.length === 0) {
    const nonHeading = lines.map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
    const expected = nonHeading.filter((line) => /expected|diharapkan|pastikan|verify/i.test(line)).map(listValue);
    const steps = nonHeading.filter((line) => /^\s*(?:[-*+]\s+|\d+[.)]\s*)/.test(line) && !/expected|diharapkan/i.test(line)).map((line, index) => ({ id: String(index + 1), action: listValue(line) }));
    const title = h1 || path.basename(input, path.extname(input));
    const all = nonHeading.join(' ');
    const capabilities = inferCapabilities(all);
    scenarios.push({
      id: `SC-${slug(title).slice(0, 20)}-01`, feature: title, title, objective: title,
      actors: [], preconditions: [], steps: steps.length ? steps : [{ id: '1', action: all || title }],
      expected: expected.length ? expected : [`Outcome described by scenario: ${title}`], test_data: {}, cleanup: [],
      tags: [...new Set(all.match(/@[A-Za-z0-9_-]+/g) || [])], derived_from: null,
      risk: { impact: 2, likelihood: 2, score: 4, priority: 'high' }, capabilities,
      proof_layers: proofLayers(capabilities), status: 'planned'
    });
  }
  return scenarios;
}

const raw = fs.readFileSync(input, 'utf8');
let manifest;
if (path.extname(input).toLowerCase() === '.json') {
  manifest = JSON.parse(raw.replace(/^\uFEFF/, ''));
} else {
  manifest = {
    manifest_version: 1,
    run_id: runId(),
    source: {
      type: 'markdown',
      path: path.relative(process.cwd(), input).split(path.sep).join('/') || path.basename(input),
      language: detectLanguage(raw)
    },
    scenarios: parseMarkdown(raw)
  };
}

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
if (output) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, serialized, 'utf8');
} else process.stdout.write(serialized);
