#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SUPPRESSIONS = '.oxlint-suppressions.json';
const TARGETS = ['src', 'index.ts', 'test-utils'];
export function countViolations(diagnostics) {
  const counts = {};
  for (const { filename, code } of diagnostics) {
    counts[filename] ??= {};
    counts[filename][code] = (counts[filename][code] ?? 0) + 1;
  }
  return counts;
}

export function compare(actual, allowed) {
  const grown = [];
  const stale = [];
  for (const [file, rules] of Object.entries(actual)) {
    for (const [rule, count] of Object.entries(rules)) {
      const limit = allowed[file]?.[rule]?.count ?? 0;
      if (count > limit) grown.push({ file, rule, count, limit });
    }
  }
  for (const [file, rules] of Object.entries(allowed)) {
    for (const [rule, { count }] of Object.entries(rules)) {
      const now = actual[file]?.[rule] ?? 0;
      if (now < count) stale.push({ file, rule, count: now, limit: count });
    }
  }
  return { grown, stale };
}

function sorted(counts) {
  const out = {};
  for (const file of Object.keys(counts).sort()) {
    out[file] = {};
    for (const rule of Object.keys(counts[file]).sort()) out[file][rule] = { count: counts[file][rule] };
  }
  return out;
}

function runOxlint() {
  let output;
  try {
    output = execFileSync('npx', ['oxlint', '-c', 'oxlint.config.mjs', '--format', 'json', ...TARGETS], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch (error) {
    output = error.stdout;
  }
  return JSON.parse(output).diagnostics;
}

function main() {
  const mode = process.argv[2] ?? 'check';
  if (!['check', '--prune', '--write'].includes(mode)) {
    console.error('usage: check-oxlint.mjs [--prune | --write]');
    process.exit(2);
  }
  const diagnostics = runOxlint();
  const actual = countViolations(diagnostics);
  const path = resolve(SUPPRESSIONS);
  const allowed = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};

  if (mode === '--write') {
    writeFileSync(path, `${JSON.stringify(sorted(actual), null, 2)}\n`);
    console.log(`${SUPPRESSIONS}: ${diagnostics.length} violations recorded`);
    return;
  }

  const { grown, stale } = compare(actual, allowed);

  if (mode === '--prune') {
    const pruned = {};
    for (const [file, rules] of Object.entries(allowed)) {
      for (const [rule, { count }] of Object.entries(rules)) {
        const now = Math.min(count, actual[file]?.[rule] ?? 0);
        if (now > 0) {
          pruned[file] ??= {};
          pruned[file][rule] = now;
        }
      }
    }
    writeFileSync(path, `${JSON.stringify(sorted(pruned), null, 2)}\n`);
    console.log(`${SUPPRESSIONS}: ${stale.length} entries lowered`);
    if (grown.length === 0) return;
  }

  for (const { file, rule } of grown) {
    for (const d of diagnostics.filter(x => x.filename === file && x.code === rule)) {
      const line = d.labels?.[0]?.span?.line ?? 0;
      console.error(`${file}:${line}  ${rule}  ${d.message}`);
    }
  }
  if (mode === 'check') {
    for (const { file, rule, count, limit } of stale) {
      console.error(`${SUPPRESSIONS} allows ${limit} ${rule} in ${file}, ${count} left: run npm run check:oxlint -- --prune`);
    }
  }
  if (grown.length > 0 || (mode === 'check' && stale.length > 0)) {
    console.error('See .agents/rules/guardrails.md#oxlint');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
