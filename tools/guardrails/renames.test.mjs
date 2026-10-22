// Run with: node --test tools/guardrails/renames.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { followRenames, parseRenames } from './renames.mjs';

const mobileMove = [['mobile/src/services/api.ts', 'mobile/src/shared/services/api.ts']];

test('parses renames and skips other statuses', () => {
  const output = ['M', 'a.ts', 'R090', 'mobile/src/a.ts', 'mobile/src/b/a.ts', 'C100', 'x', 'y', ''].join('\0');
  assert.deepEqual(parseRenames(output), [['mobile/src/a.ts', 'mobile/src/b/a.ts']]);
});

test('a shared list follows a repository path', () => {
  assert.equal(
    followRenames('no-fetch exclude /mobile/src/services/api.ts', mobileMove, undefined),
    'no-fetch exclude /mobile/src/shared/services/api.ts'
  );
});

test('a project list follows a project path of its own project', () => {
  assert.equal(
    followRenames('ignore **/src/services/api.ts', mobileMove, 'mobile'),
    'ignore **/src/shared/services/api.ts'
  );
});

test("a move in one project never rewrites the other project's entries", () => {
  assert.equal(
    followRenames('ignore **/src/services/api.ts', mobileMove, 'backend'),
    'ignore **/src/services/api.ts'
  );
  assert.equal(
    followRenames('rule exclude /backend/src/services/api.ts', mobileMove, undefined),
    'rule exclude /backend/src/services/api.ts'
  );
});

test('matches on a path boundary only', () => {
  assert.equal(
    followRenames('ignore **/src/services/xapi.ts', [['mobile/src/services/api.ts', 'mobile/x.ts']], 'mobile'),
    'ignore **/src/services/xapi.ts'
  );
});
