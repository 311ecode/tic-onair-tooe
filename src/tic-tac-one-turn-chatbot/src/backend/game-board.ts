import { Board, Cell, Coordinate, PlayerMarker } from 'tic-tac-types';
import { isValidBoardState, getNextPlayer } from 'tic-tac-valid';
import { checkWinner } from 'tic-tac-winner';

export function createEmptyBoard(size: number): Board {
  if (size < 3) {
    throw new Error('Board size must be at least 3');
  }

  const board: Board = [];
  for (let i = 0; i < size; i++) {
    board[i] = Array(size).fill(null);
  }
  return board;
}

export function makeMove(board: Board, coord: Coordinate, marker: PlayerMarker): Board {
  if (!isValidMove(board, coord)) {
    throw new Error(`Invalid move at position (${coord.x}, ${coord.y})`);
  }

  const expectedMarker = getNextPlayer(board);
  if (marker !== expectedMarker) {
    throw new Error(`Invalid player: expected ${expectedMarker}, got ${marker}`);
  }

  const newBoard = board.map(row => [...row]);
  newBoard[coord.y][coord.x] = marker;
  return newBoard;
}

export function isValidMove(board: Board, coord: Coordinate): boolean {
  const size = board.length;

  if (coord.x < 0 || coord.x >= size || coord.y < 0 || coord.y >= size) {
    return false;
  }

  return board[coord.y][coord.x] === null;
}

export function getValidMoves(board: Board): Coordinate[] {
  const validMoves: Coordinate[] = [];
  const size = board.length;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === null) {
        validMoves.push({ x, y });
      }
    }
  }

  return validMoves;
}

export function isBoardFull(board: Board): boolean {
  return getValidMoves(board).length === 0;
}

export function getGameState(
  board: Board,
  winLength: number = 3
): 'X_WIN' | 'O_WIN' | 'DRAW' | 'IN_PROGRESS' {
  const winner = checkWinner(board, winLength);

  if (winner === 'X') {
    return 'X_WIN';
  }
  if (winner === 'O') {
    return 'O_WIN';
  }
  if (isBoardFull(board)) {
    return 'DRAW';
  }
  return 'IN_PROGRESS';
}

export function formatBoard(board: Board): string {
  const size = board.length;
  let result = '';

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      result += board[y][x] ?? ' ';
      if (x < size - 1) {
        result += '|';
      }
    }
    if (y < size - 1) {
      result += '\n' + '-'.repeat(size * 2 - 1) + '\n';
    }
  }

  return result;
}

