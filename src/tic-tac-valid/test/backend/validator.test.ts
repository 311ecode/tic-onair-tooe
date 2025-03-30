import { test } from 'node:test';
import assert from 'node:assert';
import { 
  isValidBoardState, 
  getNextPlayer,
  validateMove
} from '../../src/backend/validator';
import { Board, Coordinate } from 'tic-tac-types';

function createEmptyBoard(size: number = 3): Board {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

test('Board Validator Tests', async (t) => {
  await t.test('should validate an empty board as valid', () => {
    const board = createEmptyBoard();
    assert.strictEqual(isValidBoardState(board), true);
  });

  await t.test('should validate a board where X has one more move', () => {
    const board = createEmptyBoard();
    board[0][0] = 'X';
    assert.strictEqual(isValidBoardState(board), true);
  });

  await t.test('should validate a board with equal X and O moves', () => {
    const board = createEmptyBoard();
    board[0][0] = 'X';
    board[1][1] = 'O';
    assert.strictEqual(isValidBoardState(board), true);
  });

  await t.test('should invalidate a board where O has more moves than X', () => {
    const board = createEmptyBoard();
    board[0][0] = 'O';
    assert.strictEqual(isValidBoardState(board), false);
  });

  await t.test('should invalidate a board where X has two more moves than O', () => {
    const board = createEmptyBoard();
    board[0][0] = 'X';
    board[0][1] = 'X';
    assert.strictEqual(isValidBoardState(board), false);
  });

  await t.test('should invalidate a null board', () => {
    const board = null as unknown as Board;
    assert.strictEqual(isValidBoardState(board), false);
  });

  await t.test('should validate a valid move', () => {
    const board = createEmptyBoard();
    const coord: Coordinate = { x: 1, y: 1 };
    assert.doesNotThrow(() => validateMove(board, coord));
  });

  await t.test('should throw for out of bounds x coordinate', () => {
    const board = createEmptyBoard();
    const coord: Coordinate = { x: 3, y: 1 };
    assert.throws(() => validateMove(board, coord), /Invalid move coordinates/);
  });

  await t.test('should throw for out of bounds y coordinate', () => {
    const board = createEmptyBoard();
    const coord: Coordinate = { x: 1, y: 3 };
    assert.throws(() => validateMove(board, coord), /Invalid move coordinates/);
  });

  await t.test('should throw for negative x coordinate', () => {
    const board = createEmptyBoard();
    const coord: Coordinate = { x: -1, y: 1 };
    assert.throws(() => validateMove(board, coord), /Invalid move coordinates/);
  });

  await t.test('should throw for negative y coordinate', () => {
    const board = createEmptyBoard();
    const coord: Coordinate = { x: 1, y: -1 };
    assert.throws(() => validateMove(board, coord), /Invalid move coordinates/);
  });

  await t.test('should throw for occupied cell', () => {
    const board = createEmptyBoard();
    board[1][1] = 'X';
    const coord: Coordinate = { x: 1, y: 1 };
    assert.throws(() => validateMove(board, coord), /Cell at \(1, 1\) is already occupied/);
  });

  await t.test('should throw for invalid board', () => {
    const board = [] as Board;
    const coord: Coordinate = { x: 1, y: 1 };
    assert.throws(() => validateMove(board, coord), /Invalid board/);
  });
});
