import { Board, Coordinate, PlayerMarker } from 'tic-tac-types';
import { isValidBoardState, getNextPlayer } from 'tic-tac-valid';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AIClient {
    getNextMove(board: Board, difficulty: Difficulty): Promise<Coordinate>;
}

export abstract class BaseAIClient implements AIClient {
    abstract getNextMove(board: Board, difficulty: Difficulty): Promise<Coordinate>;

    protected getValidMoves(board: Board): Coordinate[] {
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

    protected formatBoard(board: Board): string {
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
        result += '\n' + ' - '.repeat(size * 2 - 1) + '\n';
      }
    }

    return result;
  }

    protected getMarkers(board: Board): { aiMarker: PlayerMarker, humanMarker: PlayerMarker } {
    const aiMarker = getNextPlayer(board);
    const humanMarker = aiMarker === 'X' ? 'O' : 'X';
    return { aiMarker, humanMarker };
  }

    protected getRandomMove(board: Board): Coordinate {
    const validMoves = this.getValidMoves(board);

    if (validMoves.length === 0) {
      throw new Error('No valid moves available');
    }

    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
}

