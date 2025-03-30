import { Board, Coordinate, PlayerMarker } from 'tic-tac-types';
import { isValidBoardState, getNextPlayer } from 'tic-tac-valid';
import { checkWinner } from 'tic-tac-winner';
import {
  createEmptyBoard,
  makeMove,
  isValidMove,
  getValidMoves,
  isBoardFull,
  getGameState,
  formatBoard
} from './game-board.js';
import {
  GameManager,
  type GameOptions,
  type GameResult
} from './game-manager.js';

import * as dotenv from 'dotenv';

dotenv.config();

export const helloWorld = "Hello World from Tic Tac Toe Game Manager!";

export {
  createEmptyBoard,
  makeMove,
  isValidMove,
  getValidMoves,
  isBoardFull,
  getGameState,
  formatBoard,

  GameManager,

  isValidBoardState,
  getNextPlayer,
  checkWinner,

  GameOptions,
  GameResult,

  Board,
  Coordinate,
  PlayerMarker,
};

export async function main(): Promise<void> {
  console.log(helloWorld);

  const apiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("Warning: AI_API_KEY or DEEPSEEK_API_KEY not found in .env. AI will use basic fallback logic.");
  }

  console.log('Creating a new Tic Tac Toe game...');

  const game = new GameManager(apiKey || 'fallback', {
    boardSize: 3,
    playerMarker: 'X',
    difficulty: 'medium',
    winLength: 3
  });

  await game.startGame();

  console.log('Game created and started!');
  console.log('Initial Board:');
  console.log(formatBoard(game.getBoard()));
  console.log('Current player:', game.getCurrentPlayer());

  if (game.isPlayerTurn()) {
    console.log('Making player move at(1, 1)...');
    const success = await game.makePlayerMove({ x: 1, y: 1 });
    if (success) {
      console.log('Move successful!');
      console.log('Board after move:');
      console.log(formatBoard(game.getBoard()));
    } else {
      console.error('Move failed!');
    }
  }

  if (game.isGameOver()) {
    console.log('Game over! Result: ', game.getGameResult());
  } else {
    console.log('Current player:', game.getCurrentPlayer());
  }
}
