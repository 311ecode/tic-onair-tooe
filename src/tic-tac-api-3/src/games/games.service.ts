import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { checkWinner } from 'tic-tac-winner';
import { hashBoardSHA1 } from 'tic-tac-board-hash';
import { storeGameResult, getAllCompletedGames } from 'tic-tac-db';
import type { WinStateRecord } from 'tic-tac-db';
import { Board, PlayerMarker, Coordinate } from 'tic-tac-types';
import { EvaluateGameDto } from './dto/evaluate-game.dto';
import { MakeMoveDto } from './dto/make-move.dto';
import { isValidBoardState, getNextPlayer, validateMove } from 'tic-tac-valid';
import { GameManager } from './game-manager';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(private readonly gameManager: GameManager) {
    this.logger.log('<<<<< GamesService INSTANTIATED (in tic-tac-api-3) >>>>>');
  }

  async evaluateGame(
    evaluateGameDto: EvaluateGameDto
  ): Promise<WinStateRecord | { winner: null; stored: false }> {
    const { board, winLength } = evaluateGameDto;

    if (
      !board || !Array.isArray(board) || board.length < 3 ||
      !board.every((row) => Array.isArray(row) && row.length === board.length)
    ) {
      throw new BadRequestException('Invalid board structure: Must be a square 2D array (min 3x3).');
    }
    for (const row of board) {
      for (const cell of row) {
        if (cell !== 'X' && cell !== 'O' && cell !== null) {
          throw new BadRequestException(`Invalid cell value found: ${cell}. Only 'X', 'O', or null are allowed.`);
        }
      }
    }

    this.logger.log(`Evaluating game state with winLength: ${winLength}`);

    let winner: PlayerMarker | null = null;
    try {
      winner = checkWinner(board, winLength);
    } catch (e) {
      this.logger.error(`Error calling checkWinner: ${e.message}`, e.stack);
      throw new InternalServerErrorException(`Failed during winner check: ${e.message}`);
    }

    if (!winner) {
      this.logger.log('No winner found.');
      return { winner: null, stored: false };
    }

    this.logger.log(`Winner found: ${winner}. Storing game result...`);

    try {
      let boardHash: string | null = null;
      try {
        boardHash = hashBoardSHA1(board);
      } catch (e) {
        this.logger.error(`Error calling hashBoardSHA1: ${e.message}`, e.stack);
        throw new InternalServerErrorException(`Failed during board hashing: ${e.message}`);
      }

      let storedResult: WinStateRecord | null = null;
      try {
        storedResult = await storeGameResult(boardHash, board, winner, winLength);
      } catch (e) {
        this.logger.error(`Error calling storeGameResult: ${e.message}`, e.stack);
        throw new InternalServerErrorException('An unexpected error occurred while storing the game result.');
      }

      if (!storedResult) {
         const existing = await storeGameResult(boardHash, board, winner, winLength);
         if (existing) {
            this.logger.warn(`Game result hash ${boardHash} already stored (race condition?). Returning existing.`);
            return existing;
         }
        this.logger.error(`Failed to store game result hash ${boardHash}. storeGameResult returned null.`);
        throw new InternalServerErrorException('Failed to store game result after win detection.');
      }

      this.logger.log(`Game result stored successfully with ID: ${storedResult.id}`);
      return storedResult;

    } catch (error) {
      this.logger.error('Error during game result storage:', error);
      if (error instanceof InternalServerErrorException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('An unexpected error occurred while storing the game result.');
    }
  }

  async findAllCompletedGames(): Promise<WinStateRecord[]> {
    this.logger.log('Retrieving all completed games...');
    try {
       let games: WinStateRecord[] = [];
       try {
            games = await getAllCompletedGames();
       } catch(e) {
             this.logger.error(`Error calling getAllCompletedGames: ${e.message}`, e.stack);
             throw new InternalServerErrorException('Failed to retrieve completed games.');
       }
      this.logger.log(`Retrieved ${games.length} completed games.`);
      return games;
    } catch (error) {
      this.logger.error('Error retrieving completed games:', error);
       if (error instanceof InternalServerErrorException) {
           throw error;
       }
      throw new InternalServerErrorException('Failed to retrieve completed games.');
    }
  }

  async makeMove(
    makeMoveDto: MakeMoveDto
  ): Promise<{
    board: Board;
    winner: PlayerMarker | null;
    gameOver: boolean;
    nextPlayer: PlayerMarker;
    aiMove?: Coordinate | null;
  }> {
    const { board, x, y, winLength, difficulty, withAI } = makeMoveDto;

    if (
      !board ||
      !Array.isArray(board) ||
      board.length < 3 ||
      !board.every((row) => Array.isArray(row) && row.length === board.length)
    ) {
      throw new BadRequestException(
        'Invalid board structure: Must be a square 2D array (min 3x3).'
      );
    }

    for (const row of board) {
      for (const cell of row) {
        if (cell !== 'X' && cell !== 'O' && cell !== null) {
          throw new BadRequestException(
            `Invalid cell value found: ${cell}. Only 'X', 'O', or null are allowed.`
          );
        }
      }
    }

    if (!isValidBoardState(board)) {
      throw new BadRequestException('Invalid game state');
    }

    try {
      const playerMove: Coordinate = { x, y };
      const aiDifficulty = difficulty || 'medium';
      
      const result = await this.gameManager.processMove(
        board,
        playerMove,
        winLength,
        withAI === true,
        aiDifficulty as 'easy' | 'medium' | 'hard'
      );
      
      return result;
    } catch (error) {
      this.logger.error(`Error processing move: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      } else if (
        error.message && (
          error.message.includes('is already occupied') ||
          error.message.includes('Invalid move coordinates') ||
          error.message.includes('Invalid board')
        )
      ) {
        throw new BadRequestException(error.message);
      }
      
      throw new InternalServerErrorException(
        `An unexpected error occurred while processing move: ${error.message}`
      );
    }
  }
}
