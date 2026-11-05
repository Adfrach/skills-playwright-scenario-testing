#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('playwright-scenario.config.json');
const errors = [];
const allowedTop = new Set(['version', 'application', 'targets', 'auth', 'paths', 'execution', 'artifacts', 'capabilities', 'safety', 'compatibility']);
const allowedCapabilities = new Set([
  'api', 'e2e', 'component', 'visual', 'accessibility', 'mobile', 'i18n', 'files',
  'multiContext', 'frames', 'clock', 'network', 'realtime', 'offline', 'canvas',
  'electron', 'extension', 'webmcp', 'multiUser', 'migration', 'ci', 'coverage',
  'security', 'performance'
]);
const capabilityModes = new Set(['auto', 'enabled', 'disabled']);
const envPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
const semverPattern = /^\d+\.\d+\.\d+(?:[+-][0-9A-Za-z.-]+)?$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkUnknown(object, allowed, at) {
  if (!isObject(object)) return;
  for (const key of Object.keys(object)) if (!allowed.has(key)) errors.push(`${at}.${key}: unknown property`);
}

function checkEnum(value, values, at) {
  if (value !== undefined && !values.includes(value)) errors.push(`${at}: expected one of ${values.join(', ')}`);
}

function checkEnv(value, at) {
  if (value !== undefined && (typeof value !== 'string' || !envPattern.test(value))) errors.push(`${at}: expected an environment-variable name`);
}

function checkStringArray(value, at) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || !v.trim())) errors.push(`${at}: expected an array of non-empty strings`);
  else if (new Set(value).size !== value.length) errors.push(`${at}: duplicate values are not allowed`);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
} catch (error) {
  console.error(JSON.stringify({ valid: false, file, errors: [`Unable to parse JSON: ${error.message}`] }, null, 2));
  process.exit(1);
}

if (!isObject(config)) errors.push('$: expected an object');
else {
  checkUnknown(config, allowedTop, '$');
  if (config.version !== 1) errors.push('$.version: expected 1');

  if (config.application !== undefined) {
    checkUnknown(config.application, new Set(['name', 'kind', 'framework']), '$.application');
    checkEnum(config.application?.kind, ['web', 'api', 'component', 'electron', 'extension', 'mixed'], '$.application.kind');
    checkEnum(config.application?.framework, ['auto', 'react', 'vue', 'angular', 'nextjs', 'other'], '$.application.framework');
  }

  if (config.targets !== undefined) {
    checkUnknown(config.targets, new Set(['defaultEnvironment', 'authorizedHosts', 'environments']), '$.targets');
    checkStringArray(config.targets?.authorizedHosts, '$.targets.authorizedHosts');
    if (config.targets?.environments !== undefined && !isObject(config.targets.environments)) errors.push('$.targets.environments: expected an object');
    for (const [name, target] of Object.entries(config.targets?.environments || {})) {
      checkUnknown(target, new Set(['baseUrlEnv', 'apiBaseUrlEnv', 'readOnly']), `$.targets.environments.${name}`);
      checkEnv(target?.baseUrlEnv, `$.targets.environments.${name}.baseUrlEnv`);
      checkEnv(target?.apiBaseUrlEnv, `$.targets.environments.${name}.apiBaseUrlEnv`);
    }
  }

  if (config.auth !== undefined) {
    checkUnknown(config.auth, new Set(['strategy', 'identityEnv', 'passwordEnv', 'tokenEnv', 'storageStatePath', 'roles']), '$.auth');
    checkEnum(config.auth?.strategy, ['auto', 'none', 'ui', 'api', 'storage-state'], '$.auth.strategy');
    for (const key of ['identityEnv', 'passwordEnv', 'tokenEnv']) checkEnv(config.auth?.[key], `$.auth.${key}`);
    if (config.auth?.roles !== undefined && !isObject(config.auth.roles)) errors.push('$.auth.roles: expected an object');
    for (const [role, value] of Object.entries(config.auth?.roles || {})) {
      checkUnknown(value, new Set(['identityEnv', 'passwordEnv', 'tokenEnv', 'storageStatePath']), `$.auth.roles.${role}`);
      for (const key of ['identityEnv', 'passwordEnv', 'tokenEnv']) checkEnv(value?.[key], `$.auth.roles.${role}.${key}`);
    }
  }

  if (config.paths !== undefined) {
    checkUnknown(config.paths, new Set(['scenarioRoots', 'e2eRoots', 'apiRoots', 'componentRoots', 'supportRoots', 'resultRoot', 'defectRoot']), '$.paths');
    for (const key of ['scenarioRoots', 'e2eRoots', 'apiRoots', 'componentRoots', 'supportRoots']) checkStringArray(config.paths?.[key], `$.paths.${key}`);
  }

  if (config.execution !== undefined) {
    checkUnknown(config.execution, new Set(['layerPolicy', 'projects', 'maxDiagnosticCycles', 'finalRerun', 'language']), '$.execution');
    checkEnum(config.execution?.layerPolicy, ['auto', 'api', 'e2e', 'component', 'combined'], '$.execution.layerPolicy');
    checkStringArray(config.execution?.projects, '$.execution.projects');
    const cycles = config.execution?.maxDiagnosticCycles;
    if (cycles !== undefined && (!Number.isInteger(cycles) || cycles < 1 || cycles > 3)) errors.push('$.execution.maxDiagnosticCycles: expected an integer from 1 to 3');
  }

  if (config.artifacts !== undefined) checkUnknown(config.artifacts, new Set(['prd', 'testPlan', 'traceability', 'evidence', 'defects']), '$.artifacts');

  if (config.capabilities !== undefined) {
    if (!isObject(config.capabilities)) errors.push('$.capabilities: expected an object');
    else for (const [key, value] of Object.entries(config.capabilities)) {
      if (!allowedCapabilities.has(key)) errors.push(`$.capabilities.${key}: unknown capability`);
      if (!capabilityModes.has(value)) errors.push(`$.capabilities.${key}: expected auto, enabled, or disabled`);
    }
  }

  if (config.safety !== undefined) {
    checkUnknown(config.safety, new Set(['productionMutation', 'securityMode', 'performanceMode', 'requireAuthorizedTarget', 'requireStoppingCondition']), '$.safety');
    if (config.safety?.productionMutation !== undefined && config.safety.productionMutation !== 'deny') errors.push('$.safety.productionMutation: only "deny" is allowed in saved config');
    checkEnum(config.safety?.securityMode, ['design', 'safe', 'explicit'], '$.safety.securityMode');
    checkEnum(config.safety?.performanceMode, ['design', 'safe', 'explicit'], '$.safety.performanceMode');
  }

  if (config.compatibility !== undefined) {
    checkUnknown(config.compatibility, new Set(['minimumPlaywrightVersion', 'maximumPlaywrightVersion', 'strict']), '$.compatibility');
    for (const key of ['minimumPlaywrightVersion', 'maximumPlaywrightVersion']) {
      const value = config.compatibility?.[key];
      if (value !== undefined && (typeof value !== 'string' || !semverPattern.test(value))) errors.push(`$.compatibility.${key}: expected semantic version x.y.z`);
    }
  }

  function scanSecrets(value, at = '$') {
    if (!isObject(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const childAt = `${at}.${key}`;
      if (/^(password|token|secret|cookie|apiKey|credential)$/i.test(key)) errors.push(`${childAt}: store an environment-variable name instead of a secret value`);
      if (isObject(child)) scanSecrets(child, childAt);
    }
  }
  scanSecrets(config);
}

const result = { valid: errors.length === 0, file, errors };
console.log(JSON.stringify(result, null, 2));
process.exit(result.valid ? 0 : 1);
