import { Board, PlayerMarker } from 'tic-tac-types';

export type WinPattern = 'horizontal' | 'vertical' | 'diagonal-tl-br' | 'diagonal-tr-bl';

export function createEmptyBoard(size: number = 10): Board {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

export function createRandomWinningBoard(
  size: number = 10,
  winLength: number = 5,
  marker: PlayerMarker = 'X'
): { board: Board; pattern: WinPattern; winPosition: { row: number; col: number } } {
  const board = createEmptyBoard(size);

  const patterns: WinPattern[] = ['horizontal', 'vertical', 'diagonal-tl-br', 'diagonal-tr-bl'];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];

  let startRow: number, startCol: number;

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

export function addRealisticGameplayNoise(
  board: Board,
  playerA: PlayerMarker = 'X',
  playerB: PlayerMarker = 'O',
  noiseLevel: number = 0.3
): Board {
  const rows = board.length;
  const cols = board[0].length;

  const boardCopy: Board = board.map(row => [...row]);

  const emptyCells: Array<[number, number]> = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (boardCopy[i][j] === null) {
        emptyCells.push([i, j]);
      }
    }
  }

  emptyCells.sort(() => Math.random() - 0.5);

  const cellsToFill = Math.min(
    Math.floor(emptyCells.length * noiseLevel),
    emptyCells.length
  );

  for (let i = 0; i < cellsToFill; i++) {
    const [row, col] = emptyCells[i];
    boardCopy[row][col] = i % 2 === 0 ? playerA : playerB;
  }

  return boardCopy;
}