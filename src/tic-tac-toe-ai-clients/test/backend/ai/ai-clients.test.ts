import { test } from 'node:test';
import assert from 'node:assert';
import { AIClientFactory, SimpleAIClient, DeepSeekAdapter, BaseAIClient } from '../../../src/backend/ai/index.js';
import { Board, Coordinate, PlayerMarker } from 'tic-tac-types';
import * as dotenv from 'dotenv';

dotenv.config();

function createTestBoard(size: number): Board {
  if (size < 3) throw new Error('Test board size must be at least 3');
  return Array(size).fill(null).map(() => Array(size).fill(null));
}


test('AI Clients Tests', async (t) => {

  await t.test('AIClientFactory should create SimpleAIClient when no API key', () => {
    const client = AIClientFactory.createClient({});
    assert(client instanceof SimpleAIClient, 'Client should be an instance of SimpleAIClient');
  });

  await t.test('AIClientFactory should create DeepSeekAdapter when API key is provided', { skip: !process.env.DEEPSEEK_API_KEY }, () => {
    const apiKey = process.env.DEEPSEEK_API_KEY!;
    const client = AIClientFactory.createClient({ apiKey });
    assert(client instanceof DeepSeekAdapter, 'Client should be an instance of DeepSeekAdapter');
  });

  await t.test('SimpleAIClient should return a valid move on an empty board', async () => {
    const client = new SimpleAIClient();
    const board = createTestBoard(3);
    const move = await client.getNextMove(board, 'medium');
    assert.ok(move, 'Should return a move object');
    assert.strictEqual(typeof move.x, 'number', 'Move should have x coordinate');
    assert.strictEqual(typeof move.y, 'number', 'Move should have y coordinate');
    assert.ok(move.x >= 0 && move.x < 3, 'x coordinate should be in bounds');
    assert.ok(move.y >= 0 && move.y < 3, 'y coordinate should be in bounds');
    assert.strictEqual(board[move.y][move.x], null, 'Chosen cell should be empty');
  });

  await t.test('SimpleAIClient should win if possible', async () => {
    const client = new SimpleAIClient();
    const board: Board = [
      ['X', 'X', null],
      ['O', 'O', null],
      [null, null, null]
    ];
    const move = await client.getNextMove(board, 'medium');
    assert.deepStrictEqual(move, { x: 2, y: 0 }, 'AI should win at (2,0)');
  });

  await t.test('DeepSeekAdapter should return a move', { skip: !process.env.DEEPSEEK_API_KEY }, async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY!;
    const client = new DeepSeekAdapter({ apiKey });
    const board = createTestBoard(3);
    const move = await client.getNextMove(board, 'medium');
    assert.ok(move, 'DeepSeek should return a move object');
    assert.strictEqual(typeof move.x, 'number');
    assert.strictEqual(typeof move.y, 'number');
    assert.ok(move.x >= 0 && move.x < 3);
    assert.ok(move.y >= 0 && move.y < 3);
    assert.strictEqual(board[move.y][move.x], null, 'DeepSeek chosen cell should be empty');
  });

});
