import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkTreeEntry, followFolderRenames } from './check-tree-entries.mjs';

test('keeps the folder and the verdict of a message', () => {
  assert.equal(
    checkTreeEntry('src/features/search/services holds a single child: move it up one level and delete the folder'),
    'src/features/search/services holds a single child'
  );
});

test('drops the count and the file list, which change with the folder', () => {
  assert.equal(
    checkTreeEntry('src/test holds 7 lib files (deferred.ts, session.ts): move them into lib/'),
    'src/test holds lib files'
  );
  assert.equal(
    checkTreeEntry('src/test holds 6 lib files (deferred.ts): move them into lib/'),
    checkTreeEntry('src/test holds 7 lib files (deferred.ts, session.ts): move them into lib/')
  );
});

test('two folders with the same verdict stay two entries', () => {
  assert.notEqual(
    checkTreeEntry('src/types is not a layer: move it'),
    checkTreeEntry('src/test is not a layer: move it')
  );
});

test('an entry follows its folder when a file of it moves', () => {
  assert.equal(
    followFolderRenames(
      'src/types holds lib files',
      [['mobile/src/types/user.types.ts', 'mobile/src/shared/types/user.types.ts']],
      'mobile'
    ),
    'src/shared/types holds lib files'
  );
});

test('a move from another folder leaves the entry alone', () => {
  assert.equal(
    followFolderRenames(
      'src/types holds lib files',
      [['mobile/src/types/sub/a.ts', 'mobile/src/shared/a.ts']],
      'mobile'
    ),
    'src/types holds lib files'
  );
});
