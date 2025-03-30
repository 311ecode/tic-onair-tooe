import { test } from 'node:test';
import assert from 'node:assert';
import type { Board, Cell, Coordinate, PlayerMarker } from '../../src/backend';

test('Board Types Usability', async (t) => {
  await t.test('should allow creating a valid board with types', () => {
    const marker: PlayerMarker = 'X';
    const cell: Cell = 'O';
    const board: Board = [
      [marker, cell, null],
      ['O', null, 'X'],
      [null, 'X', 'O'],
    ];
    const coord: Coordinate = { x: 1, y: 2 };

    assert.strictEqual(typeof board[0][0], 'string', 'Board cell should be a string or null');
    assert.strictEqual(typeof coord.x, 'number', 'Coordinate x should be a number');
  });
});
