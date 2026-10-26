#!/usr/bin/env node
// Runs the checks that ship as Docker images, so nothing needs Python or Go:
//   semgrep  pattern rules from tools/semgrep/rules.yml
//   secrets  gitleaks on the project's tracked and untracked, not ignored files
// Images are pinned by digest; bump the tag and digest together.
// See .agents/rules/guardrails.md.
//
// Usage: node ../tools/guardrails/docker-scan.mjs <semgrep|secrets> <backend|mobile>
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMGREP_IMAGE =
  'semgrep/semgrep:1.140.0@sha256:4372a1de903521f9f10f877b6caf15d150d17e1ca592582682c8d02b77cbd4f6';
const GITLEAKS_IMAGE =
  'zricethezav/gitleaks:v8.28.0@sha256:cdbb7c955abce02001a9f6c9f602fb195b7fadc1e812065883f695d1eeaba854';

const root = resolve(fileURLToPath(import.meta.url), '../../..');
const [tool, project] = process.argv.slice(2);

if (!['semgrep', 'secrets'].includes(tool) || !['backend', 'mobile'].includes(project)) {
  console.error('usage: docker-scan.mjs <semgrep|secrets> <backend|mobile>');
  process.exit(2);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) {
    console.error(`${command}: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

if (spawnSync('docker', ['info'], { stdio: 'ignore' }).status !== 0) {
  console.error(
    `${tool}: Docker is not running. It runs from a pinned Docker image; start Docker and retry. ` +
      'See .agents/rules/guardrails.md#what-check-runs'
  );
  process.exit(1);
}

if (tool === 'semgrep') {
  // semgrep lists the files to scan with git. In a worktree, .git is a file pointing into the
  // main checkout's .git, so that directory is mounted at the same path too.
  const gitDir = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd: root,
  });
  if (gitDir.status !== 0) {
    console.error(`semgrep: ${gitDir.stderr.toString().trim()}`);
    process.exit(1);
  }
  const commonGitDir = gitDir.stdout.toString().trim();
  const outDir = mkdtempSync(join(tmpdir(), 'semgrep-'));
  let status = 1;
  try {
    status = run('docker', [
      'run', '--rm', '--network', 'none',
      '-v', `${root}:/src:ro`, '-w', '/src',
      ...(commonGitDir === join(root, '.git') ? [] : ['-v', `${commonGitDir}:${commonGitDir}:ro`]),
      '-v', `${outDir}:/out`,
      SEMGREP_IMAGE,
      'semgrep', 'scan',
      '--config', 'tools/semgrep/rules.yml',
      '--error', '--metrics=off', '--disable-version-check', '--quiet',
      '--json-output=/out/report.json',
      project,
    ]);
    // semgrep exits 0 when it could not list any file: an empty scan is a failure, not a pass.
    const report = JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf8'));
    if (status === 0 && report.paths.scanned.length === 0) {
      console.error(
        `semgrep: no file of ${project}/ was scanned, so no rule was checked. ` +
          'See .agents/rules/guardrails.md#what-check-runs'
      );
      status = 1;
    }
  } catch (error) {
    console.error(`semgrep: ${error.message}`);
    status = 1;
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
  process.exit(status);
}

// secrets: copy what git would commit (tracked, plus untracked files that are
// not ignored) so local .env files, node_modules and build output are skipped.
const scanDir = mkdtempSync(join(tmpdir(), 'gitleaks-'));
let status = 1;
try {
  const files = spawnSync('git', ['ls-files', '-z', '-co', '--exclude-standard', project], {
    cwd: root,
        maxBuffer: 64 * 1024 * 1024,
  });
  if (files.status !== 0) throw new Error(files.stderr.toString());
  // ls-files still lists tracked files deleted from disk; tar would fail on them.
  const present = files.stdout
    .toString()
    .split('\0')
    .filter((path) => path !== '' && existsSync(join(root, path)));
  const pack = spawnSync('tar', ['--null', '-T', '-', '-cf', '-'], {
    cwd: root,
    input: present.map((path) => `${path}\0`).join(''),
    maxBuffer: 1024 * 1024 * 1024,
  });
  const unpack = spawnSync('tar', ['-xf', '-', '-C', scanDir], {
    input: pack.stdout,
    maxBuffer: 1024 * 1024 * 1024,
  });
  if (pack.status !== 0 || unpack.status !== 0) {
    throw new Error('could not copy the project files to scan');
  }
  status = run('docker', [
    'run', '--rm', '--network', 'none',
    '-v', `${scanDir}:/scan:ro`,
    '-v', `${join(root, '.gitleaks.toml')}:/gitleaks.toml:ro`,
    GITLEAKS_IMAGE,
    'dir', '/scan', '--config', '/gitleaks.toml', '--no-banner', '--redact', '--verbose',
    '--log-level', 'warn',
  ]);
  if (status !== 0) {
    console.error(
      'secrets: remove the secret and rotate it, or, for a value public by design, ' +
        'allow it in .gitleaks.toml. See .agents/rules/guardrails.md#no-secrets'
    );
  }
} catch (error) {
  console.error(`secrets: ${error.message}`);
} finally {
  rmSync(scanDir, { recursive: true, force: true });
}
process.exit(status);
