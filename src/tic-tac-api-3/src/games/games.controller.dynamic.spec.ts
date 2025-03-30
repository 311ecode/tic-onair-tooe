import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { EvaluateGameDto } from './dto/evaluate-game.dto';
import { Board } from 'tic-tac-types';
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

describe('GamesController - Dynamic Board Size Feature', () => {
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

  it('should handle evaluating a larger board size with custom winLength', async () => {
    const largeBoard: Board = [
      ['X', 'X', 'X', 'X', null],
      ['O', 'O', null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ];
    const largeDto: EvaluateGameDto = { board: largeBoard, winLength: 4 };
    const largeWinResult: WinStateRecord = { 
      id: 2, 
      boardHash: 'hash-large', 
      boardState: largeBoard, 
      winner: 'X', 
      winLength: 4, 
      createdAt: new Date() 
    };
    
    mockGamesService.evaluateGame.mockResolvedValue(largeWinResult);
    const result = await controller.evaluateGame(largeDto);
    
    expect(service.evaluateGame).toHaveBeenCalledWith(largeDto);
    expect(result).toEqual(largeWinResult);
    
    if (isWinStateRecord(result)) {
      expect(result.winLength).toBe(4);
    } else {
      fail('Expected result to be a WinStateRecord');
    }
  });
  
  it('should handle default winLength when not specified', async () => {
    const board: Board = [
      ['X', 'X', 'X'],
      ['O', 'O', null],
      [null, null, null]
    ];
    const dto: EvaluateGameDto = { board };
    const winResult: WinStateRecord = { 
      id: 3, 
      boardHash: 'hash-default', 
      boardState: board, 
      winner: 'X', 
      winLength: 3,
      createdAt: new Date() 
    };
    
    mockGamesService.evaluateGame.mockResolvedValue(winResult);
    const result = await controller.evaluateGame(dto);
    
    expect(service.evaluateGame).toHaveBeenCalledWith(dto);
    
    if (isWinStateRecord(result)) {
      expect(result.winLength).toBe(3);
    } else {
      fail('Expected result to be a WinStateRecord');
    }
  });
});
