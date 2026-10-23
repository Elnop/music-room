#!/usr/bin/env node
// Runs the given npm scripts of the current project in parallel and prints
// `<check> OK`, or `<check> FAILED` followed by the last lines of its output
// (where test runners and linters put the cause and the summary).
// Exits non-zero when any check fails. Used by `npm run check` in backend/ and
// mobile/; see .agents/rules/guardrails.md.
//
// Usage: node ../tools/guardrails/run-checks.mjs <script> [<script>...]
// A script named `check:<name>` is reported as `<name>`.
import { spawn } from 'node:child_process';

const MAX_LINES = 30;
const scripts = process.argv.slice(2);

if (scripts.length === 0) {
  console.error('usage: run-checks.mjs <npm script> [<npm script>...]');
  process.exit(2);
}

const ANSI = /\x1b\[[0-9;]*m/g;

// Where each check is explained, for tools whose own messages cannot say it.
const DOCS = '.agents/rules/guardrails.md#what-check-runs';

function run(script) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn('npm', ['run', '--silent', script], {
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', CI: process.env.CI ?? 'true' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('close', (code) => {
      resolve({ script, code, output, seconds: ((Date.now() - started) / 1000).toFixed(1) });
    });
    child.on('error', (error) => resolve({ script, code: 1, output: String(error), seconds: '0' }));
  });
}

const name = (script) => script.replace(/^check:/, '');
const width = Math.max(...scripts.map((s) => name(s).length));

const results = await Promise.all(
  scripts.map(async (script) => {
    const result = await run(script);
    const label = name(script).padEnd(width);
    if (result.code === 0) {
      console.log(`${label}  OK      (${result.seconds}s)`);
    } else {
      const lines = result.output
        .replace(ANSI, '')
        .split('\n')
        .filter((line) => line.trim() !== '');
      const shown = lines.slice(-MAX_LINES).map((line) => `    ${line}`);
      if (lines.length > MAX_LINES) {
        shown.unshift(`    ... ${lines.length - MAX_LINES} earlier lines: run \`npm run ${script}\``);
      }
      shown.push(`    See ${DOCS} (${name(script)})`);
      console.log(`${label}  FAILED  (${result.seconds}s)\n${shown.join('\n')}`);
    }
    return result;
  })
);

const failed = results.filter((result) => result.code !== 0);
if (failed.length > 0) {
  console.log(
    `\ncheck failed: ${failed.map((r) => name(r.script)).join(', ')}. ` +
      'Each rule is explained in .agents/rules/; never weaken a rule or grow an exception list to pass.'
  );
  process.exit(1);
}
console.log('\ncheck passed');
