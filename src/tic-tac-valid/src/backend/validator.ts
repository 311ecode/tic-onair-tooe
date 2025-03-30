import { Board, PlayerMarker, Coordinate } from 'tic-tac-types';

export function isValidBoardState(board: Board): boolean {
  if (!board || !board.length || !board[0].length) {
    return false;
  }

  let countX = 0;
  let countO = 0;

  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === 'X') {
        countX++;
      } else if (board[i][j] === 'O') {
        countO++;
      }
    }
  }

  return countX === countO || countX === countO + 1;
}

export function getNextPlayer(board: Board): PlayerMarker {
  if (!board || !board.length || !board[0].length) {
    return 'X';
  }

  let countX = 0;
  let countO = 0;

  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === 'X') {
        countX++;
      } else if (board[i][j] === 'O') {
        countO++;
      }
    }
  }

  return countX === countO ? 'X' : 'O';
}

export function validateMove(board: Board, coord: Coordinate): void {
  if (!board || !board.length || !board[0].length) {
    throw new Error('Invalid board: Board is empty or not properly initialized');
  }

  if (
    coord.x < 0 ||
    coord.x >= board.length ||
    coord.y < 0 ||
    coord.y >= board.length
  ) {
    throw new Error(`Invalid move coordinates (${coord.x}, ${coord.y})`);
  }

  if (board[coord.y][coord.x] !== null) {
    throw new Error(`Cell at (${coord.x}, ${coord.y}) is already occupied`);
  }
}

