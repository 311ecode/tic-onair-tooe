import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { EvaluateGameDto } from './dto/evaluate-game.dto';
import { Board, PlayerMarker } from 'tic-tac-types';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { WinStateRecord } from 'tic-tac-db';

function isWinStateRecord(
  record: WinStateRecord | { winner: null; stored: false }
): record is WinStateRecord {
  return record.winner !== null && 'id' in record;
}

const mockGamesService = {
  evaluateGame: jest.fn(),
  findAllCompletedGames: jest.fn(),
};

describe('GamesController - Evaluate Game Feature', () => {
  let controller: GamesController;
  let service: GamesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService, 
          useValue: mockGamesService, 
        },
      ],
    }).compile();

    controller = module.get<GamesController>(GamesController);
    service = module.get<GamesService>(GamesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('evaluateGame endpoint', () => {
    const winningBoardX: Board = [['X', 'X', 'X'], ['O', 'O', null], [null, null, null]];
    const evaluateDto: EvaluateGameDto = { board: winningBoardX, winLength: 3 };
    const winResult: WinStateRecord = { id: 1, boardHash: 'hash1', boardState: winningBoardX, winner: 'X', winLength: 3, createdAt: new Date() };
    const noWinResult = { winner: null, stored: false };

    it('should call gamesService.evaluateGame with the DTO', async () => {
      mockGamesService.evaluateGame.mockResolvedValue(noWinResult);
      await controller.evaluateGame(evaluateDto);
      expect(service.evaluateGame).toHaveBeenCalledWith(evaluateDto);
    });

    it('should return the result from gamesService when a winner is found', async () => {
      mockGamesService.evaluateGame.mockResolvedValue(winResult);
      const result = await controller.evaluateGame(evaluateDto);
      expect(result).toEqual(winResult);
    });

    it('should return the result from gamesService when no winner is found', async () => {
      mockGamesService.evaluateGame.mockResolvedValue(noWinResult);
      const result = await controller.evaluateGame(evaluateDto);
      expect(result).toEqual(noWinResult);
    });

    it('should propagate BadRequestException from service', async () => {
      const badRequestError = new BadRequestException('Invalid board input');
      mockGamesService.evaluateGame.mockRejectedValue(badRequestError);
      await expect(controller.evaluateGame(evaluateDto)).rejects.toThrow(BadRequestException);
      await expect(controller.evaluateGame(evaluateDto)).rejects.toThrow('Invalid board input');
    });

    it('should propagate InternalServerErrorException from service', async () => {
      const internalError = new InternalServerErrorException('DB error');
      mockGamesService.evaluateGame.mockRejectedValue(internalError);
      await expect(controller.evaluateGame(evaluateDto)).rejects.toThrow(InternalServerErrorException);
      await expect(controller.evaluateGame(evaluateDto)).rejects.toThrow('DB error');
    });

    it('should wrap unexpected errors in InternalServerErrorException', async () => {
      const genericError = new Error('Something unexpected happened');
      mockGamesService.evaluateGame.mockRejectedValue(genericError);
      await expect(controller.evaluateGame(evaluateDto)).rejects.toThrow(InternalServerErrorException);
      await expect(controller.evaluateGame(evaluateDto)).rejects.toThrow(
        'An unexpected error occurred during game evaluation: Something unexpected happened'
      );
    });
  });
});
