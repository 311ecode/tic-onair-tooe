import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AIClientFactory, BaseAIClient } from 'tic-tac-toe-ai-clients';
import { Board, PlayerMarker, Coordinate } from 'tic-tac-types';
import { checkWinner } from 'tic-tac-winner';
import { isValidBoardState, getNextPlayer, validateMove } from 'tic-tac-valid';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class GameManager {
  private readonly logger = new Logger(GameManager.name);
  private readonly aiClient: BaseAIClient;

  constructor() {
    const aiApiKey = process.env.DEEPSEEK_API_KEY || 'fallback';
    const aiModel = process.env.DEEPSEEK_MODEL || 'deepseek-coder';

    this.aiClient = AIClientFactory.createClient({
      apiKey: aiApiKey,
      model: aiModel
    });

    this.logger.log(`GameManager initialized with AI client: ${this.aiClient.constructor.name}`);
  }

    async processMove(
    board: Board,
    moveCoordinate: Coordinate,
    winLength: number = 3,
    getAIResponse: boolean = false,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<{
    board: Board;
    winner: PlayerMarker | null;
    gameOver: boolean;
    nextPlayer: PlayerMarker;
    aiMove?: Coordinate | null;
  }> {
    try {
      validateMove(board, moveCoordinate);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    const currentPlayer = getNextPlayer(board);
    let updatedBoard = this.applyMove(board, moveCoordinate, currentPlayer);

    let winner = checkWinner(updatedBoard, winLength);
    let gameOver = winner !== null || this.isBoardFull(updatedBoard);
    let aiMove: Coordinate | null = null;

    if (!gameOver && getAIResponse) {
      try {
        aiMove = await this.aiClient.getNextMove(updatedBoard, difficulty);

        const aiPlayer = getNextPlayer(updatedBoard);
        updatedBoard = this.applyMove(updatedBoard, aiMove, aiPlayer);

        winner = checkWinner(updatedBoard, winLength);
        gameOver = winner !== null || this.isBoardFull(updatedBoard);

        this.logger.log(`AI (${this.aiClient.constructor.name}) made move: (${aiMove.x}, ${aiMove.y})`);
      } catch (error) {
        this.logger.error(`Error getting AI move: ${error.message}`, error.stack);
      }
    }

    return {
      board: updatedBoard,
      winner,
      gameOver,
      nextPlayer: getNextPlayer(updatedBoard),
      aiMove
    };
  }

    private applyMove(board: Board, move: Coordinate, player: PlayerMarker): Board {
    const newBoard = board.map(row => [...row]);
    newBoard[move.y][move.x] = player;
    return newBoard;
  }

    private isBoardFull(board: Board): boolean {
    return board.flat().every(cell => cell !== null);
  }
}

