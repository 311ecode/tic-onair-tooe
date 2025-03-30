import { Board, PlayerMarker, Cell } from 'tic-tac-types';
import { isValidBoardState } from 'tic-tac-valid';

export function checkWinner(board: Board, winLength: number = 3, skipValidation: boolean = false): PlayerMarker | null {
  if (!board || !board.length || !board[0].length) {
    return null;
  }

  if (!skipValidation && !isValidBoardState(board)) {
    return null;
  }

  const rows = board.length;
  const cols = board[0].length;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j <= cols - winLength; j++) {
      if (checkSequence(board[i].slice(j, j + winLength))) {
        return board[i][j] as PlayerMarker;
      }
    }
  }

  for (let j = 0; j < cols; j++) {
    for (let i = 0; i <= rows - winLength; i++) {
      const column: Cell[] = [];
      for (let k = 0; k < winLength; k++) {
        column.push(board[i + k][j]);
      }
      if (checkSequence(column)) {
        return board[i][j] as PlayerMarker;
      }
    }
  }

  for (let i = 0; i <= rows - winLength; i++) {
    for (let j = 0; j <= cols - winLength; j++) {
      const diagonal: Cell[] = [];
      for (let k = 0; k < winLength; k++) {
        diagonal.push(board[i + k][j + k]);
      }
      if (checkSequence(diagonal)) {
        return board[i][j] as PlayerMarker;
      }
    }
  }

  for (let i = 0; i <= rows - winLength; i++) {
    for (let j = winLength - 1; j < cols; j++) {
      const diagonal: Cell[] = [];
      for (let k = 0; k < winLength; k++) {
        diagonal.push(board[i + k][j - k]);
      }
      if (checkSequence(diagonal)) {
        return board[i][j] as PlayerMarker;
      }
    }
  }

  return null;
}

function checkSequence(sequence: Cell[]): boolean {
  if (sequence.length === 0) return false;
  const first = sequence[0];
  if (!first) return false;
  return sequence.every(cell => cell === first);
}

