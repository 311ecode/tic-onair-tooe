import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { InternalServerErrorException } from '@nestjs/common';
import { WinStateRecord } from 'tic-tac-db';

const mockGamesService = {
  evaluateGame: jest.fn(),
  findAllCompletedGames: jest.fn(),
};

describe('GamesController - Get Games Feature', () => {
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

  describe('getCompletedGames endpoint', () => {
    const mockGames: WinStateRecord[] = [
       { id: 1, boardHash: 'hash1', boardState: [], winner: 'X', winLength: 3, createdAt: new Date() },
       { id: 2, boardHash: 'hash2', boardState: [], winner: 'O', winLength: 3, createdAt: new Date() },
    ];

    it('should call gamesService.findAllCompletedGames', async () => {
      mockGamesService.findAllCompletedGames.mockResolvedValue([]);
      await controller.getCompletedGames();
      expect(service.findAllCompletedGames).toHaveBeenCalledTimes(1);
    });

    it('should return the array of games from the service', async () => {
      mockGamesService.findAllCompletedGames.mockResolvedValue(mockGames);
      const result = await controller.getCompletedGames();
      expect(result).toEqual(mockGames);
    });

    it('should propagate InternalServerErrorException from service', async () => {
       const internalError = new InternalServerErrorException('DB read error');
       mockGamesService.findAllCompletedGames.mockRejectedValue(internalError);
       await expect(controller.getCompletedGames()).rejects.toThrow(InternalServerErrorException);
       await expect(controller.getCompletedGames()).rejects.toThrow('DB read error');
    });

    it('should wrap unexpected errors in InternalServerErrorException', async () => {
       const genericError = new Error('Something else went wrong');
       mockGamesService.findAllCompletedGames.mockRejectedValue(genericError);
       await expect(controller.getCompletedGames()).rejects.toThrow(InternalServerErrorException);
       await expect(controller.getCompletedGames()).rejects.toThrow(
          'An unexpected error occurred while retrieving games: Something else went wrong'
       );
    });

    it('should return an empty array when no games exist', async () => {
      mockGamesService.findAllCompletedGames.mockResolvedValue([]);
      const result = await controller.getCompletedGames();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
