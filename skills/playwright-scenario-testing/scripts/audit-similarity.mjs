#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ownRoot = process.argv[2] ? path.resolve(process.argv[2]) : null;
const corpusRoot = process.argv[3] ? path.resolve(process.argv[3]) : null;
const width = Number(process.argv[4] || 12);
const ignored = new Set(['node_modules', '.git', 'dist', 'build']);

if (!ownRoot || !corpusRoot || width < 8) {
  console.error('Usage: node audit-similarity.mjs <own-directory> <comparison-directory> [shingle-width>=8]');
  process.exit(1);
}

function collect(root, current = root, out = []) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) collect(root, full, out);
    else if (entry.isFile() && /\.(md|mdx|txt)$/i.test(entry.name)) out.push({ file: path.relative(root, full).split(path.sep).join('/'), text: fs.readFileSync(full, 'utf8') });
  }
  return out;
}

function words(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[`*_>#|()[\]{}:;,.!?"']/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 1 && !/^\d+(?:\.\d+)*$/.test(word));
}

function shingles(file) {
  const tokens = words(file.text);
  const out = [];
  for (let index = 0; index <= tokens.length - width; index += 1) {
    out.push({ key: tokens.slice(index, index + width).join(' '), file: file.file });
  }
  return out;
}

const ownFiles = collect(ownRoot);
const corpusFiles = collect(corpusRoot);
const corpusIndex = new Map();
for (const file of corpusFiles) for (const item of shingles(file)) {
  if (!corpusIndex.has(item.key)) corpusIndex.set(item.key, new Set());
  corpusIndex.get(item.key).add(item.file);
}

const matches = [];
const seen = new Set();
for (const file of ownFiles) for (const item of shingles(file)) {
  const corpusMatches = corpusIndex.get(item.key);
  if (!corpusMatches) continue;
  const identity = `${item.file}\n${item.key}`;
  if (seen.has(identity)) continue;
  seen.add(identity);
  matches.push({ ownFile: item.file, corpusFiles: [...corpusMatches].slice(0, 5), phrase: item.key });
}

const result = {
  shingleWidth: width,
  ownFiles: ownFiles.length,
  corpusFiles: corpusFiles.length,
  exactSharedPhrases: matches.length,
  matches: matches.slice(0, 100)
};
console.log(JSON.stringify(result, null, 2));
process.exit(matches.length ? 2 : 0);
