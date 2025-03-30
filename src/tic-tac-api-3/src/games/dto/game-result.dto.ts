import { Board, PlayerMarker } from 'tic-tac-types';

export class GameResultDto {
  id: number;
  boardHash: string;
  boardState: Board;
  winner: PlayerMarker;
  winLength: number;
  createdAt: Date;
}

