import { test } from 'node:test';
import assert from 'node:assert';
import { checkWinner } from '../../src/backend/winner';
import { testCheckWinner } from './test-fix';
import { Board, PlayerMarker } from 'tic-tac-types';

function createEmptyBoard(size: number = 10): Board {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

test('Winner Detection Tests', async (t) => {
  await t.test('should detect horizontal win on 10x10 board', () => {
    const board = createEmptyBoard();
    for (let i = 0; i < 5; i++) {
      board[0][i] = 'X';
    }
    assert.strictEqual(testCheckWinner(board, 5), 'X');
  });

  await t.test('should detect vertical win on 10x10 board', () => {
    const board = createEmptyBoard();
    for (let i = 0; i < 5; i++) {
      board[i][0] = 'O';
    }
    assert.strictEqual(testCheckWinner(board, 5), 'O');
  });

  await t.test('should detect diagonal win (TL-BR) on 10x10 board', () => {
    const board = createEmptyBoard();
    for (let i = 0; i < 5; i++) {
      board[i][i] = 'X';
    }
    assert.strictEqual(testCheckWinner(board, 5), 'X');
  });

  await t.test('should detect diagonal win (TR-BL) on 10x10 board', () => {
    const board = createEmptyBoard();
    for (let i = 0; i < 5; i++) {
      board[i][9 - i] = 'O';
    }
    assert.strictEqual(testCheckWinner(board, 5), 'O');
  });

  await t.test('should return null when no winner on 10x10 board', () => {
    const board = createEmptyBoard();
    board[0][0] = 'X';
    board[1][1] = 'O';
    board[2][2] = 'X';
    assert.strictEqual(testCheckWinner(board, 5), null);
  });

  await t.test('should return null for empty 10x10 board', () => {
    const board = createEmptyBoard();
    assert.strictEqual(testCheckWinner(board, 5), null);
  });

  await t.test('should return null for invalid board', () => {
    const board = [] as Board;
    assert.strictEqual(testCheckWinner(board, 5), null);
  });
  
  await t.test('should reject invalid game state during actual game', () => {
    const board = createEmptyBoard(3);
    board[0][0] = 'X';
    board[0][1] = 'X';
    assert.strictEqual(checkWinner(board, 3), null);
    assert.strictEqual(testCheckWinner(board, 3), null);
  });
  
  await t.test('should detect win with valid game state', () => {
    const board = createEmptyBoard(3);
    board[0][0] = 'X';
    board[1][0] = 'O';
    board[0][1] = 'X';
    board[1][1] = 'O';
    board[0][2] = 'X';
    assert.strictEqual(checkWinner(board, 3), 'X');
  });
});
