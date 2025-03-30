import { test } from 'node:test';
import assert from 'node:assert';
import { testCheckWinner } from './test-fix';
import { PlayerMarker } from 'tic-tac-types/src/backend';
import {
  createRandomWinningBoard,
  addRealisticGameplayNoise,
  WinPattern,
  createEmptyBoard
} from './test-utils';

function boardToString(board: any[][]): string {
  return board.map(row =>
    row.map(cell => cell === null ? '.' : cell).join(' ')
  ).join('\n');
}

function createBoardWithPattern(
  pattern: WinPattern,
  size: number,
  winLength: number,
  marker: PlayerMarker
): { board: any[][], winPosition: { row: number, col: number }, pattern: WinPattern } {
  const board = createEmptyBoard(size);
  let startRow = 0;
  let startCol = 0;

  switch (pattern) {
    case 'horizontal':
      startRow = Math.floor(Math.random() * size);
      startCol = Math.floor(Math.random() * (size - winLength + 1));
      for (let i = 0; i < winLength; i++) {
        board[startRow][startCol + i] = marker;
      }
      break;

    case 'vertical':
      startRow = Math.floor(Math.random() * (size - winLength + 1));
      startCol = Math.floor(Math.random() * size);
      for (let i = 0; i < winLength; i++) {
        board[startRow + i][startCol] = marker;
      }
      break;

    case 'diagonal-tl-br':
      startRow = Math.floor(Math.random() * (size - winLength + 1));
      startCol = Math.floor(Math.random() * (size - winLength + 1));
      for (let i = 0; i < winLength; i++) {
        board[startRow + i][startCol + i] = marker;
      }
      break;

    case 'diagonal-tr-bl':
      startRow = Math.floor(Math.random() * (size - winLength + 1));
      startCol = Math.floor(Math.random() * (size - winLength + 1)) + (winLength - 1);
      for (let i = 0; i < winLength; i++) {
        board[startRow + i][startCol - i] = marker;
      }
      break;
  }

  return {
    board,
    pattern,
    winPosition: { row: startRow, col: startCol }
  };
}

function testWinnerDetection(
  board: any[][],
  winLength: number,
  expectedWinner: PlayerMarker,
  pattern: WinPattern,
  winPosition: { row: number, col: number },
  boardSize: number
): void {
  const winner = testCheckWinner(board, winLength);

  if (winner !== expectedWinner) {
    console.error(`Expected winner ${expectedWinner} not found! Found ${winner || 'none'} instead.`);
    console.error(`Board size: ${boardSize}x${boardSize}, Win length: ${winLength}`);
    console.error(`Pattern: ${pattern}, Win position: (${winPosition.row}, ${winPosition.col})`);
    console.error(boardToString(board));
  }

  assert.strictEqual(winner, expectedWinner,
    `Expected ${expectedWinner} to win with ${pattern} pattern at (${winPosition.row}, ${winPosition.col})`);
}

test('Random Winner Detection Tests', async (t) => {
  const boardSizes = [3, 5, 10];
  const winLengths = [3, 4, 5];
  const markers: PlayerMarker[] = ['X', 'O'];

  const getNoiseLevelForSize = (size: number, winLength: number) => {
    if (size >= 10 && winLength <= 3) return 0.15;
    if (size >= 5) return 0.2;
    return 0.3;
  };

  for (const size of boardSizes) {
    for (const winLength of winLengths) {
      if (winLength > size) continue;

      for (const marker of markers) {
        const opponentMarker = marker === 'X' ? 'O' : 'X';
        const noiseLevel = getNoiseLevelForSize(size, winLength);

        await t.test(`should detect ${marker} win with winLength=${winLength} on ${size}x${size} board`, () => {
          const { board, pattern, winPosition } = createRandomWinningBoard(size, winLength, marker);

          const noisyBoard = addRealisticGameplayNoise(board, marker, opponentMarker, noiseLevel);

          testWinnerDetection(noisyBoard, winLength, marker, pattern, winPosition, size);
        });
      }
    }
  }

  const noiseLevels = [0.1, 0.2, 0.3, 0.4];

  for (const noiseLevel of noiseLevels) {
    const winLength = 5;
    const boardSize = 10;

    await t.test(`should detect win with noise level ${noiseLevel}`, () => {
      const marker: PlayerMarker = 'X';
      const { board, pattern, winPosition } = createBoardWithPattern('horizontal', boardSize, winLength, marker);

      const noisyBoard = addRealisticGameplayNoise(board, marker, 'O', noiseLevel);
      testWinnerDetection(noisyBoard, winLength, marker, pattern, winPosition, boardSize);
    });
  }

  const patterns: WinPattern[] = ['horizontal', 'vertical', 'diagonal-tl-br', 'diagonal-tr-bl'];

  for (const pattern of patterns) {
    await t.test(`should detect ${pattern} win with noise`, () => {
      const size = 10;
      const winLength = 5;
      const noiseLevel = 0.2;

      for (let i = 0; i < 2; i++) {
        const marker: PlayerMarker = i === 0 ? 'X' : 'O';
        const opponentMarker = marker === 'X' ? 'O' : 'X';

        const { board, winPosition } = createBoardWithPattern(pattern, size, winLength, marker);

        const noisyBoard = addRealisticGameplayNoise(board, marker, opponentMarker, noiseLevel);

        testWinnerDetection(noisyBoard, winLength, marker, pattern, winPosition, size);
      }
    });
  }
});

