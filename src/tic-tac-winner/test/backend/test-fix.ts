import { checkWinner } from '../../src/backend/winner';
import { Board, PlayerMarker } from 'tic-tac-types';

export function testCheckWinner(board: Board, winLength: number = 3): PlayerMarker | null {
  return checkWinner(board, winLength, true);
}