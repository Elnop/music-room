import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compare, countViolations } from './check-oxlint.mjs';

const diagnostic = (filename, code) => ({ filename, code });

test('counts the violations of each rule in each file', () => {
  assert.deepEqual(
    countViolations([diagnostic('a.ts', 'r1'), diagnostic('a.ts', 'r1'), diagnostic('b.ts', 'r2')]),
    { 'a.ts': { r1: 2 }, 'b.ts': { r2: 1 } }
  );
});

test('reports a count above the suppression, and a new rule or file', () => {
  const { grown } = compare({ 'a.ts': { r1: 3, r2: 1 }, 'c.ts': { r1: 1 } }, { 'a.ts': { r1: { count: 2 } } });
  assert.deepEqual(
    grown.map(({ file, rule }) => `${file} ${rule}`),
    ['a.ts r1', 'a.ts r2', 'c.ts r1']
  );
});

test('reports a suppression that allows more than what is left', () => {
  const { grown, stale } = compare({ 'a.ts': { r1: 1 } }, { 'a.ts': { r1: { count: 2 } }, 'b.ts': { r2: { count: 1 } } });
  assert.deepEqual(grown, []);
  assert.deepEqual(
    stale.map(({ file, rule, count }) => `${file} ${rule} ${count}`),
    ['a.ts r1 1', 'b.ts r2 0']
  );
});
