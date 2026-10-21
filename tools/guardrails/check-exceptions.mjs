#!/usr/bin/env node
// Fails when an exception list grew. Exception lists record the violations
// that existed when a rule was introduced; a story that cleans files removes
// their entries, and nothing may add one. See
// .agents/rules/guardrails.md#exception-lists.
//
// Each list is compared, per rule, with the same file at the fork point from
// develop (merge-base of HEAD and $GUARDRAILS_BASE, default origin/develop)
// and with HEAD, so both a branch and uncommitted changes are caught. A file
// that does not exist in a reference yet is not compared with it.
//
// Usage: node tools/guardrails/check-exceptions.mjs [backend] [mobile]
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../../..');
const args = process.argv.slice(2);
const projects = args.length > 0 ? args : ['backend', 'mobile'];

for (const project of projects) {
  if (!['backend', 'mobile'].includes(project)) {
    console.error('usage: check-exceptions.mjs [backend] [mobile]');
    process.exit(2);
  }
}

// --- counters: file content -> { "<rule> <metric>": number } ---------------

function countEslint(text) {
  const counts = {};
  for (const rules of Object.values(JSON.parse(text))) {
    for (const [rule, { count }] of Object.entries(rules)) {
      counts[`${rule} (files)`] = (counts[`${rule} (files)`] ?? 0) + 1;
      counts[`${rule} (occurrences)`] = (counts[`${rule} (occurrences)`] ?? 0) + count;
    }
  }
  return counts;
}

function countDepcruise(text) {
  const counts = {};
  for (const violation of JSON.parse(text)) {
    const rule = violation.rule?.name ?? 'unknown';
    counts[rule] = (counts[rule] ?? 0) + 1;
  }
  return counts;
}

function countJscpd(text) {
  return { 'ignore globs': (JSON.parse(text).ignore ?? []).length };
}

// Counts the `exclude:` entries of each rule in tools/semgrep/rules.yml.
function countSemgrep(text) {
  const counts = {};
  let rule = null;
  let excludeIndent = -1;
  for (const line of text.split('\n')) {
    const content = line.replace(/\s+#.*$/, '');
    if (/^\s*(#.*)?$/.test(content)) continue;
    const indent = line.search(/\S/);
    const id = content.match(/^\s*- id:\s*(\S+)/);
    if (id) {
      rule = id[1];
      excludeIndent = -1;
      continue;
    }
    if (excludeIndent >= 0 && indent > excludeIndent && /^\s*- /.test(content)) {
      counts[`${rule} excludes`] = (counts[`${rule} excludes`] ?? 0) + 1;
      continue;
    }
    excludeIndent = /^\s*exclude:\s*$/.test(content) ? indent : -1;
  }
  return counts;
}

// Counts the allowlists of .gitleaks.toml and the values they hold.
function countGitleaks(text) {
  const code = text
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
  return {
    allowlists: (code.match(/^\s*\[\[allowlists\]\]/gm) ?? []).length,
    'allowlist values': (code.match(/'''[\s\S]*?'''/g) ?? []).length,
  };
}

const lists = [
  ...projects.flatMap((project) => [
    { path: `${project}/eslint-suppressions.json`, count: countEslint },
    { path: `${project}/.dependency-cruiser-known-violations.json`, count: countDepcruise },
    { path: `${project}/.jscpd.json`, count: countJscpd },
  ]),
  { path: 'tools/semgrep/rules.yml', count: countSemgrep },
  { path: '.gitleaks.toml', count: countGitleaks },
];

// --- references --------------------------------------------------------------

function git(...gitArgs) {
  try {
    return execFileSync('git', gitArgs, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

const references = [];
const candidates = [process.env.GUARDRAILS_BASE ?? 'origin/develop', 'develop'];
const base = candidates.find((ref) => git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`));
const forkPoint = base && git('merge-base', 'HEAD', base)?.trim();
if (forkPoint) {
  references.push({ label: `${base} (fork point ${forkPoint.slice(0, 7)})`, rev: forkPoint });
} else {
  console.warn(
    `warning: ${candidates.join(' or ')} not found; comparing with HEAD only. ` +
      'Run `git fetch origin develop` for the full check.'
  );
}
const head = git('rev-parse', 'HEAD')?.trim();
if (head && head !== forkPoint) references.push({ label: 'HEAD', rev: head });

// --- comparison --------------------------------------------------------------

const growths = [];
for (const list of lists) {
  const file = join(root, list.path);
  if (!existsSync(file)) {
    growths.push(`${list.path}: missing; an exception file is emptied, never deleted`);
    continue;
  }
  let current;
  try {
    current = list.count(readFileSync(file, 'utf8'));
  } catch (error) {
    growths.push(`${list.path}: cannot be read (${error.message})`);
    continue;
  }
  for (const reference of references) {
    const before = git('show', `${reference.rev}:${list.path}`);
    if (before === null) continue;
    let previous;
    try {
      previous = list.count(before);
    } catch {
      continue;
    }
    for (const [key, value] of Object.entries(current)) {
      const was = previous[key] ?? 0;
      if (value > was) {
        growths.push(`${list.path}: ${key} grew from ${was} to ${value} (vs ${reference.label})`);
      }
    }
  }
}

if (growths.length > 0) {
  console.error('Exception lists may only shrink:');
  for (const growth of growths) console.error(`  ${growth}`);
  console.error(
    'Fix the new violation instead of recording it. See .agents/rules/guardrails.md#exception-lists'
  );
  process.exit(1);
}
console.log(`exception lists did not grow (${lists.length} files, vs ${references.map((r) => r.label).join(' and ') || 'nothing'})`);
