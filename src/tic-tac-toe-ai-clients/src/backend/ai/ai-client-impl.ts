import { Board, Cell, Coordinate, PlayerMarker } from 'tic-tac-types';
import { BaseAIClient, Difficulty } from './ai-client.js';
import { DeepSeekAdapter } from './adapters/deepseek-adapter.js';
import { checkWinner } from 'tic-tac-winner';

export class AIClientFactory {
    static createClient(config: {
    apiKey?: string;
    adapter?: string;
    model?: string;
  }): BaseAIClient {
    if (config.apiKey && config.apiKey !== 'fallback') {
      console.log(`Using DeepSeek AI Client (Model: ${config.model || 'default'})`);
      return new DeepSeekAdapter({
        apiKey: config.apiKey,
        model: config.model
      });
    }

    console.log("Using Simple Fallback AI Client");
    return new SimpleAIClient();
  }
}

export class SimpleAIClient extends BaseAIClient {
    async getNextMove(board: Board, difficulty: Difficulty = 'medium'): Promise<Coordinate> {
    const validMoves = this.getValidMoves(board);

    if (validMoves.length === 0) {
      console.error('SimpleAIClient: No valid moves available');
      throw new Error('SimpleAIClient: No valid moves available');
    }

    if (difficulty === 'easy') {
      console.log(`SimpleAI [easy]: Taking random move.`);
      return this.getRandomMove(board);
    }

    const size = board.length;
    const winLength = size === 3 ? 3 : Math.min(size, 5);
    const { aiMarker, humanMarker } = this.getMarkers(board);
    console.log(`SimpleAI [${difficulty}]: My marker=${aiMarker}, Human marker=${humanMarker}, WinLength=${winLength}`);

    for (const move of validMoves) {
      const testBoard = this.simulateMove(board, move, aiMarker);
      if (checkWinner(testBoard, winLength) === aiMarker) {
        console.log(`SimpleAI [${aiMarker}]: Found winning move at ${JSON.stringify(move)}`);
        return move;
      }
    }

    for (const move of validMoves) {
      const testBoard = this.simulateMove(board, move, humanMarker);
      if (checkWinner(testBoard, winLength) === humanMarker) {
        console.log(`SimpleAI [${aiMarker}]: Found blocking move at ${JSON.stringify(move)} (blocks ${humanMarker})`);
        return move;
      }
    }

    if (difficulty === 'hard') {
      console.log(`SimpleAI [hard]: Checking hard strategy moves...`);
      if (size % 2 === 1) {
        const center = Math.floor(size / 2);
        const centerMove = validMoves.find(move => move.x === center && move.y === center);
        if (centerMove) {
          console.log(`SimpleAI [hard]: Taking center at ${JSON.stringify(centerMove)}`);
          return centerMove;
        }
      }

      const corners = [
        { x: 0, y: 0 }, { x: size - 1, y: 0 },
        { x: 0, y: size - 1 }, { x: size - 1, y: size - 1 }
      ];

      const validCornerMoves = validMoves.filter(move =>
        corners.some(corner => corner.x === move.x && corner.y === move.y)
      );

      if (validCornerMoves.length > 0) {
        const chosenCorner = validCornerMoves[Math.floor(Math.random() * validCornerMoves.length)];
        console.log(`SimpleAI [hard]: Taking corner at ${JSON.stringify(chosenCorner)}`);
        return chosenCorner;
      }

    }

    console.log(`SimpleAI [${aiMarker}]: No win/block/strategic move found, taking random move.`);
    return this.getRandomMove(board);
  }

    private simulateMove(board: Board, move: Coordinate, marker: PlayerMarker): Board {
    const newBoard = board.map(row => [...row]);
    if (newBoard[move.y]?.[move.x] === null) {
      newBoard[move.y][move.x] = marker;
    } else {
      console.warn(`SimpleAIClient simulateMove: Attempted to simulate move on non-null cell (${move.x}, ${move.y})`);
    }
    return newBoard;
  }
}
