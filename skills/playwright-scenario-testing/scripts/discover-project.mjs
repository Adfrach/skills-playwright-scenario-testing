#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());
const ignored = new Set([
  '.git', '.hg', '.svn', 'node_modules', 'playwright-report', 'test-results', 'blob-report',
  'coverage', 'dist', 'build', '.next', '.cache', '.playwright', '.playwright-cli',
  'playwright-artifacts', 'artifacts', '.codex'
]);

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/') || '.';
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return null;
  }
}

function walk(dir, depth = 0, files = []) {
  if (depth > 6) return files;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, depth + 1, files);
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function hasDependency(deps, name) {
  return Object.prototype.hasOwnProperty.call(deps, name);
}

function detectFrameworks(deps, files) {
  const frameworks = [];
  if (hasDependency(deps, 'next') || files.some((f) => /next\.config\./i.test(f))) frameworks.push('nextjs');
  if (hasDependency(deps, 'react')) frameworks.push('react');
  if (hasDependency(deps, 'vue') || hasDependency(deps, 'nuxt')) frameworks.push('vue');
  if (hasDependency(deps, '@angular/core')) frameworks.push('angular');
  if (hasDependency(deps, 'electron')) frameworks.push('electron');
  return uniqueSorted(frameworks);
}

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(JSON.stringify({ error: `Workspace does not exist: ${root}` }, null, 2));
  process.exit(1);
}

const absoluteFiles = walk(root);
const files = absoluteFiles.map(relative);
const packagePath = path.join(root, 'package.json');
const packageJson = readJson(packagePath) || {};
const dependencies = {
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
  ...(packageJson.peerDependencies || {})
};
const playwrightVersion = dependencies['@playwright/test'] || dependencies.playwright || dependencies['playwright-core'] || null;
const testFiles = files.filter((f) => /(^|\/).*\.(spec|test)\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(f));
const configFiles = files.filter((f) => /(^|\/)playwright\.config\.(ts|js|mts|mjs|cts|cjs)$/i.test(f));
const envFiles = files.filter((f) => /(^|\/)\.env(?:\.[A-Za-z0-9_.-]+)?$/i.test(f));
const supportFiles = files.filter((f) => /(^|\/)(fixtures?|support|helpers?|pages?|components?)\//i.test(f));
const ciFiles = files.filter((f) => /(^|\/)(\.github\/workflows\/.*\.ya?ml|\.gitlab-ci\.ya?ml|Jenkinsfile|azure-pipelines\.ya?ml|\.circleci\/config\.ya?ml)$/i.test(f));
const containerFiles = files.filter((f) => /(^|\/)(Dockerfile(?:\..+)?|docker-compose(?:\..+)?\.ya?ml)$/i.test(f));
const migrationSources = {
  cypress: files.filter((f) => /(^|\/)(cypress\/|cypress\.config\.)/i.test(f)),
  selenium: files.filter((f) => /(^|\/)(selenium|webdriver)/i.test(f) || /selenium|webdriver/i.test(path.basename(f)))
};
const configText = configFiles.map((f) => {
  try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return ''; }
}).join('\n');
const projects = uniqueSorted([...configText.matchAll(/name\s*:\s*['"`]([^'"`]+)['"`]/g)].map((m) => m[1]));
const reporters = uniqueSorted([...configText.matchAll(/['"`](html|json|junit|blob|line|list|dot|github)['"`]/g)].map((m) => m[1]));
const authSignals = uniqueSorted(files.filter((f) => /auth|storage[-_.]?state|global[-_.]?setup/i.test(f)));
const packageManager = fs.existsSync(path.join(root, 'pnpm-lock.yaml')) ? 'pnpm'
  : fs.existsSync(path.join(root, 'yarn.lock')) ? 'yarn'
  : fs.existsSync(path.join(root, 'bun.lockb')) || fs.existsSync(path.join(root, 'bun.lock')) ? 'bun'
  : fs.existsSync(path.join(root, 'package-lock.json')) ? 'npm'
  : null;

const result = {
  workspace: root,
  packageManager,
  moduleType: packageJson.type || 'commonjs',
  playwright: {
    declaredVersion: playwrightVersion,
    configFiles: uniqueSorted(configFiles),
    projects,
    reporters,
    localCliPackage: hasDependency(dependencies, '@playwright/cli') || hasDependency(dependencies, 'playwright') || hasDependency(dependencies, '@playwright/test')
  },
  frameworks: detectFrameworks(dependencies, files),
  scripts: packageJson.scripts || {},
  paths: {
    tests: uniqueSorted(testFiles),
    support: uniqueSorted(supportFiles),
    authSignals,
    envFileNamesOnly: uniqueSorted(envFiles),
    ci: uniqueSorted(ciFiles),
    containers: uniqueSorted(containerFiles)
  },
  migrationSources: {
    cypress: uniqueSorted(migrationSources.cypress),
    selenium: uniqueSorted(migrationSources.selenium)
  },
  warnings: []
};

if (!playwrightVersion) result.warnings.push('No Playwright dependency was found in package.json.');
if (configFiles.length === 0) result.warnings.push('No Playwright config file was found.');
if (testFiles.length === 0) result.warnings.push('No Playwright-style test files were found.');
if (envFiles.some((f) => /^\.env$/i.test(path.basename(f)))) {
  result.warnings.push('Secret-bearing env files may exist; only file names were reported and values were not read.');
}

console.log(JSON.stringify(result, null, 2));
