#!/usr/bin/env node
// Fails when an exception list grew. Exception lists record the violations
// that existed when a rule was introduced; a story that cleans files removes
// their entries, and nothing may add one. See
// .agents/rules/guardrails.md#exception-lists.
//
// Each list is compared with the same file at the fork point from develop
// (merge-base of HEAD and $GUARDRAILS_BASE, default origin/develop) and with
// HEAD, so both a branch and uncommitted changes are caught. A file that does
// not exist in a reference yet is not compared with it. Inline escapes
// (eslint-disable, nosemgrep, ast-grep-ignore, jscpd:ignore-start) may not
// grow in any file under <project>/src/; a new file starts at 0.
//
// Two changes are not growth:
// - a moved file (git rename) keeps its entries and inline escapes under its
//   new path;
// - a new rule listed in tools/guardrails/new-rule-baselines.json, with no
//   entry in the reference, may land with up to the recorded number of
//   entries (guardrails.md#exception-lists). Any other rule only shrinks.
//
// Usage: node tools/guardrails/check-exceptions.mjs [backend] [mobile]
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { followRenames, parseRenames } from './renames.mjs';

const root = resolve(fileURLToPath(import.meta.url), '../../..');
const args = process.argv.slice(2);
const projects = args.length > 0 ? args : ['backend', 'mobile'];

for (const project of projects) {
  if (!['backend', 'mobile'].includes(project)) {
    console.error('usage: check-exceptions.mjs [backend] [mobile]');
    process.exit(2);
  }
}

// --- readers: file content -> { counts?: { key: number }, entries?: Set } ---
// `counts` may not grow per key. Every string of `entries` must already exist
// in the reference, so an entry can be neither added nor widened.

function readEslint(text) {
  const counts = {};
  for (const rules of Object.values(JSON.parse(text))) {
    for (const [rule, { count }] of Object.entries(rules)) {
      counts[`${rule} (files)`] = (counts[`${rule} (files)`] ?? 0) + 1;
      counts[`${rule} (occurrences)`] = (counts[`${rule} (occurrences)`] ?? 0) + count;
    }
  }
  return { counts };
}

function readDepcruise(text) {
  const counts = {};
  for (const violation of JSON.parse(text)) {
    const rule = violation.rule?.name ?? 'unknown';
    counts[rule] = (counts[rule] ?? 0) + 1;
  }
  return { counts };
}

function readJscpd(text) {
  return { entries: new Set((JSON.parse(text).ignore ?? []).map((glob) => `ignore ${glob}`)) };
}

const unquote = (value) => value.trim().replace(/^(['"])(.*)\1$/, '$2');

// The `exclude` paths of each rule in tools/semgrep/rules.yml, block style
// (`- path`) or flow style (`exclude: [a, b]`), and each rule's
// `metadata.allowed-paths`: file-name conventions that are part of the rule's
// definition (guardrails.md#exception-lists). An exclude entry that its rule
// declares there is not counted as an exception, but only for a suffix glob
// `*<Suffix>.<ext>` (Suffix a capitalised word of 4 letters or more, such as
// `*Storage.ts`), read directly under the rule's `metadata:`. Any other
// `allowed-paths` value is ignored, so its exclude entry stays an exception.
// The `allowed` set is compared with the reference like the entries.
const ALLOWED_PATH = /^\*[A-Z][a-z]{3,}\.[a-z]+$/;

function readSemgrep(text) {
  const excludes = [];
  const allowed = new Set();
  let rule = null;
  let ruleKeyIndent = -1;
  let metadataIndent = -1;
  let list = null;
  let listIndent = -1;
  const addAllowed = (path) => {
    if (ALLOWED_PATH.test(path)) allowed.add(`${rule} ${path}`);
  };
  for (const line of text.split('\n')) {
    const content = line.replace(/\s+#.*$/, '');
    if (/^\s*(#.*)?$/.test(content)) continue;
    const indent = line.search(/\S/);
    const id = content.match(/^\s*- id:\s*(\S+)/);
    if (id) {
      rule = id[1];
      ruleKeyIndent = indent + 2;
      metadataIndent = -1;
      list = null;
      continue;
    }
    if (list && indent > listIndent && /^\s*- /.test(content)) {
      const path = unquote(content.replace(/^\s*- /, ''));
      if (list === 'exclude') excludes.push([rule, path]);
      else addAllowed(path);
      continue;
    }
    list = null;
    if (metadataIndent >= 0 && indent <= metadataIndent) metadataIndent = -1;
    if (indent === ruleKeyIndent && /^\s*metadata:\s*$/.test(content)) {
      metadataIndent = indent;
      continue;
    }
    const key = content.match(/^\s*(exclude|allowed-paths):\s*(\[(.*)\])?\s*$/);
    if (!key) continue;
    // allowed-paths counts only as a direct child of the rule's metadata.
    if (key[1] === 'allowed-paths' && !(metadataIndent >= 0 && indent === metadataIndent + 2)) {
      continue;
    }
    if (key[2] === undefined) {
      list = key[1];
      listIndent = indent;
      continue;
    }
    for (const raw of key[3].split(',').filter((p) => p.trim() !== '')) {
      const path = unquote(raw);
      if (key[1] === 'exclude') excludes.push([rule, path]);
      else addAllowed(path);
    }
  }
  const entries = new Set();
  for (const [ruleId, path] of excludes) {
    if (!allowed.has(`${ruleId} ${path}`)) entries.add(`${ruleId} exclude ${path}`);
  }
  return { entries, allowed };
}

// Every string value of the allowlist and [extend] sections of .gitleaks.toml
// (paths, regexes, stopwords, disabledRules, descriptions...), in any TOML
// string syntax.
function readGitleaks(text) {
  const entries = new Set();
  const code = text
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
  const headers = [...code.matchAll(/^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*$/gm)];
  headers.forEach((header, i) => {
    const section = header[1];
    if (!/allowlist|extend/i.test(section)) return;
    const body = code.slice(header.index + header[0].length, headers[i + 1]?.index ?? code.length);
    const strings =
      body.match(/'''[\s\S]*?'''|"""[\s\S]*?"""|"(?:[^"\\\n]|\\.)*"|'[^'\n]*'/g) ?? [];
    for (const value of strings) entries.add(`[${section}] ${value}`);
  });
  return { entries };
}

const lists = [
  ...projects.flatMap((project) => [
    { project, path: `${project}/eslint-suppressions.json`, read: readEslint },
    { project, path: `${project}/.dependency-cruiser-known-violations.json`, read: readDepcruise },
    { project, path: `${project}/.jscpd.json`, read: readJscpd },
  ]),
  { path: 'tools/semgrep/rules.yml', read: readSemgrep },
  { path: '.gitleaks.toml', read: readGitleaks },
];

// Inline escapes that bypass the lists, counted per file under <project>/src/.
const DIRECTIVES = 'eslint-disable|nosemgrep|ast-grep-ignore|jscpd:ignore-start';

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

// --- moves and new rules -----------------------------------------------------

// Files renamed between a reference and the working tree: [old, new] paths
// from the repository root.
const renamesSince = (rev) => parseRenames(git('diff', '--name-status', '-M', '-z', rev, '--') ?? '');

// The rule a count key belongs to: `guardrails/x (files)` -> `guardrails/x`.
const ruleOf = (key) => key.replace(/ \((files|occurrences)\)$/, '');

// New rules allowed to land with exceptions: { project: { rule: max entries } }.
// Adding a rule here is part of the ticket that creates the rule.
const newRuleBaselines = JSON.parse(
  readFileSync(join(root, 'tools/guardrails/new-rule-baselines.json'), 'utf8')
);

// --- comparison --------------------------------------------------------------

const newRules = new Set();

const growths = [];
for (const list of lists) {
  const file = join(root, list.path);
  if (!existsSync(file)) {
    growths.push(`${list.path}: missing; an exception file is emptied, never deleted`);
    continue;
  }
  let current;
  try {
    current = list.read(readFileSync(file, 'utf8'));
  } catch (error) {
    growths.push(`${list.path}: cannot be read (${error.message})`);
    continue;
  }
  for (const reference of references) {
    const before = git('show', `${reference.rev}:${list.path}`);
    if (before === null) continue;
    let previous;
    try {
      previous = list.read(before);
    } catch {
      continue;
    }
    const renames = renamesSince(reference.rev);
    const previousEntries = new Set(
      [...(previous.entries ?? [])].map((entry) => followRenames(entry, renames, list.project))
    );
    for (const [key, value] of Object.entries(current.counts ?? {})) {
      const was = previous.counts?.[key] ?? 0;
      const rule = ruleOf(key);
      const max = newRuleBaselines[list.project]?.[rule];
      if (!(key in (previous.counts ?? {})) && max !== undefined && value <= max) {
        newRules.add(`${list.path}: ${rule} (vs ${reference.label})`);
        continue;
      }
      if (value > was) {
        growths.push(`${list.path}: ${key} grew from ${was} to ${value} (vs ${reference.label})`);
      }
    }
    for (const entry of current.entries ?? []) {
      if (!previousEntries.has(entry)) {
        growths.push(`${list.path}: new or changed entry ${entry} (vs ${reference.label})`);
      }
    }
    // A rule's allowed-paths may grow only through new-rule-baselines.json.
    for (const entry of current.allowed ?? []) {
      const [rule, glob] = entry.split(' ');
      const baselined = newRuleBaselines.allowedPaths?.[rule]?.includes(glob);
      if (!previous.allowed?.has(entry) && !baselined) {
        growths.push(`${list.path}: new allowed-paths ${entry} (vs ${reference.label})`);
      }
    }
  }
}

// `git grep -c` prints `[<rev>:]<path>:<count>` for each matching file.
// Without a revision, it reads the working tree, untracked files included.
function countDirectives(project, rev) {
  const target = rev ? [rev] : [];
  const options = rev ? [] : ['--untracked'];
  const output =
    git('grep', '-c', ...options, '-E', DIRECTIVES, ...target, '--', `${project}/src`) ?? '';
  const counts = {};
  for (const line of output.split('\n')) {
    const match = line.match(/^(?:[0-9a-f]{40}:)?(.+):(\d+)$/);
    if (match) counts[match[1]] = Number(match[2]);
  }
  return counts;
}

for (const project of projects) {
  const current = countDirectives(project);
  for (const reference of references) {
    const previous = {};
    const renames = new Map(renamesSince(reference.rev));
    for (const [path, count] of Object.entries(countDirectives(project, reference.rev))) {
      previous[renames.get(path) ?? path] = count;
    }
    for (const [path, count] of Object.entries(current)) {
      const was = previous[path] ?? 0;
      if (count > was) {
        growths.push(
          `${path}: inline escapes (${DIRECTIVES.replaceAll('|', ', ')}) grew from ${was} to ${count} (vs ${reference.label})`
        );
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
for (const rule of newRules) console.log(`new rule, baseline accepted: ${rule}`);
console.log(
  `exception lists did not grow (${lists.length} files and inline escapes, vs ${references.map((r) => r.label).join(' and ') || 'nothing'})`
);
