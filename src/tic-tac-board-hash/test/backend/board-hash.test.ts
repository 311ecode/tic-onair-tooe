import objectHash from 'object-hash';
import { test } from 'node:test';
import assert from 'node:assert';
import { 
  hashBoard, 
  hashBoardSHA1, 
  hashBoardMD5, 
  hashBoardStructure 
} from '../../src/backend/board-hash';
import { Board, PlayerMarker } from 'tic-tac-types';

test('Board Hash Tests', async (t) => {
  const empty3x3: Board = [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ];

  const xWin3x3: Board = [
    ['X', 'X', 'X'],
    ['O', 'O', null],
    [null, null, null]
  ];

  const oWin3x3: Board = [
    ['X', 'O', 'X'],
    [null, 'O', null],
    ['X', 'O', null]
  ];

  await t.test('should generate consistent SHA1 hashes for same board', () => {
    const hash1 = hashBoardSHA1(empty3x3);
    const hash2 = hashBoardSHA1(empty3x3);
    assert.strictEqual(hash1, hash2, 'Hashes should be identical for identical boards');
    assert.strictEqual(typeof hash1, 'string', 'Hash should be a string');
    assert.strictEqual(hash1.length, 40, 'SHA1 hex hash should be 40 characters');
  });

  await t.test('should generate different hashes for different boards', () => {
    const hashEmpty = hashBoardSHA1(empty3x3);
    const hashXWin = hashBoardSHA1(xWin3x3);
    const hashOWin = hashBoardSHA1(oWin3x3);
    assert.notStrictEqual(hashEmpty, hashXWin, 'Different boards should have different hashes');
    assert.notStrictEqual(hashXWin, hashOWin, 'Different boards should have different hashes');
  });

  await t.test('should generate MD5 hashes correctly', () => {
    const hash = hashBoardMD5(empty3x3);
    assert.strictEqual(hash.length, 32, 'MD5 hex hash should be 32 characters');
  });

  await t.test('should handle structure-only hashing (different structures)', () => {
    const hash1 = hashBoardStructure(xWin3x3);
    const hash2 = hashBoardStructure(oWin3x3);
    assert.notStrictEqual(hash1, hash2, 'Structure-only hashes should differ for boards with different occupied cell patterns'); 
  });

  await t.test('should handle different encodings', () => {
    const hexHash = hashBoard(empty3x3, { encoding: 'hex' });
    const base64Hash = hashBoard(empty3x3, { encoding: 'base64' });
    const bufferHash = hashBoard(empty3x3, { encoding: 'buffer' });
    
    assert.strictEqual(typeof hexHash, 'string', 'Hex should be string');
    assert.strictEqual(typeof base64Hash, 'string', 'Base64 should be string');
    assert.ok(bufferHash instanceof Buffer, 'Buffer should be Buffer instance');
  });

  await t.test('should normalize board when requested', () => {
    const board1: Board = [
      ['O', null, 'X'],
      [null, 'X', null]
    ];
    const board2: Board = [
       [null, 'X', null],
       ['X', null, 'O']
    ];
    const normalHash1 = hashBoard(board1, { normalize: true, algorithm: 'sha1', encoding: 'hex' });
    const normalHash2 = hashBoard(board2, { normalize: true, algorithm: 'sha1', encoding: 'hex' });
    const regularHash1 = hashBoard(board1, { algorithm: 'sha1', encoding: 'hex' });
    const regularHash2 = hashBoard(board2, { algorithm: 'sha1', encoding: 'hex' });
    
    assert.strictEqual(normalHash1, normalHash2, 'Normalized hashes should match for boards that are identical after normalization');
    assert.notStrictEqual(regularHash1, regularHash2, 'Non-normalized hashes should differ');
  });


  await t.test('should handle invalid input', () => {
    const hash1 = hashBoard([] as Board); 
    const hash2 = hashBoard(null as any);
    const expectedNullHash = objectHash(null, { algorithm: 'sha1', encoding: 'hex' });

    assert.strictEqual(hash1, expectedNullHash, 'Should produce the hash of null for empty array');
    assert.strictEqual(hash2, expectedNullHash, 'Should produce the hash of null for null input');
    assert.ok(hash1, 'Hash for empty array should be truthy');
    assert.ok(hash2, 'Hash for null should be truthy');
  });
});
