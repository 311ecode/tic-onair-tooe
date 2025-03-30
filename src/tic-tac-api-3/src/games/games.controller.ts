import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { EvaluateGameDto } from './dto/evaluate-game.dto';
import { MakeMoveDto } from './dto/make-move.dto';
import { WinStateRecord } from 'tic-tac-db';
import { Board, PlayerMarker } from 'tic-tac-types';

function isWinStateRecord(
  record: WinStateRecord | { winner: null; stored: false }
): record is WinStateRecord {
  return record.winner !== null && 'id' in record;
}

@Controller('games')
export class GamesController {
  private readonly logger = new Logger(GamesController.name);

  constructor(private readonly gamesService: GamesService) {}

    @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluateGame(
    @Body() evaluateGameDto: EvaluateGameDto
  ): Promise<WinStateRecord | { winner: null; stored: false }> {
    this.logger.log(
      `Received request to evaluate game state with winLength: ${evaluateGameDto.winLength}`
    );
    try {
      const result = await this.gamesService.evaluateGame(evaluateGameDto);

      if (isWinStateRecord(result)) {
        this.logger.log(
          `Evaluation complete. Winner: ${result.winner}. Stored ID: ${result.id}`
        );
      } else {
        this.logger.log('Evaluation complete. No winner found.');
      }
      return result;
    } catch (error) {
      this.logger.error(`Error evaluating game: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`An unexpected error occurred during game evaluation: ${error.message}`);
    }
  }

    @Get()
  @HttpCode(HttpStatus.OK)
  async getCompletedGames(): Promise<WinStateRecord[]> {
    this.logger.log('Received request to get all completed games.');
    try {
      const games = await this.gamesService.findAllCompletedGames();
      return games;
    } catch (error) {
       this.logger.error(`Error retrieving completed games: ${error.message}`, error.stack);
       if (error instanceof InternalServerErrorException) {
         throw error;
       }
       throw new InternalServerErrorException(`An unexpected error occurred while retrieving games: ${error.message}`);
    }
  }

    @Post('move')
  @HttpCode(HttpStatus.OK)
  async makeMove(
    @Body() makeMoveDto: MakeMoveDto
  ): Promise<{
    board: Board;
    winner: PlayerMarker | null;
    gameOver: boolean;
    nextPlayer: PlayerMarker;
  }> {
    this.logger.log(
      `Received move request at position (${makeMoveDto.x}, ${makeMoveDto.y})`
    );
    try {
      return await this.gamesService.makeMove(makeMoveDto);
    } catch (error) {
      this.logger.error(`Error processing move: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `An unexpected error occurred while processing move: ${error.message}`
      );
    }
  }
}

