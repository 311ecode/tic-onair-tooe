import { test } from 'node:test';
import assert from 'node:assert';
import { GameManager } from '../../src/backend/game-manager.js';
import { formatBoard } from '../../src/backend/game-board.js';
import { Board, Coordinate, PlayerMarker } from 'tic-tac-types';
import * as dotenv from 'dotenv';

import { BaseAIClient, Difficulty, AIClientFactory, DeepSeekAdapter } from 'tic-tac-toe-ai-clients';

dotenv.config();

class MockAIClient extends BaseAIClient {
  private nextMove: Coordinate | null = null;
  private moveQueue: Coordinate[] = [];

  setNextMove(coord: Coordinate) {
    this.nextMove = coord;
    this.moveQueue = [];
  }

  queueMoves(coords: Coordinate[]) {
    this.moveQueue = coords;
    this.nextMove = null;
  }

  async getNextMove(board: Board, difficulty: Difficulty = 'medium'): Promise<Coordinate> {
    console.log(`MockAIClient: getNextMove called (Difficulty: ${difficulty})`);
    let move: Coordinate | null = null;

    if (this.moveQueue.length > 0) {
      move = this.moveQueue.shift()!;
      console.log(`MockAIClient: Using queued move: ${JSON.stringify(move)}`);
    } else if (this.nextMove) {
      move = this.nextMove;
      console.log(`MockAIClient: Using set move: ${JSON.stringify(move)}`);
      this.nextMove = null;
    }

    if (move) {
      const size = board.length;
      if (move.y >= 0 && move.y < size && move.x >= 0 && move.x < size && board[move.y]?.[move.x] === null) {
         return move;
       } else {
        console.warn(`MockAIClient: Provided move ${JSON.stringify(move)} is invalid on current board. Falling back.`);
      }
    }

    console.log(`MockAIClient: Falling back to first valid move.`);
    const validMoves = this.getValidMoves(board);
    if (validMoves.length > 0) {
      console.log(`MockAIClient: Fallback move: ${JSON.stringify(validMoves[0])}`);
      return validMoves[0];
    }

    console.error("MockAIClient: No valid moves available and no specific move set/queued or fallback failed.");
    throw new Error("MockAIClient: No valid moves available.");
  }
}


test('Game Manager Tests', async (t) => {
  let mockAiClient: MockAIClient;

  t.beforeEach(() => {
    mockAiClient = new MockAIClient();
  });

  await t.test('should create a new game with default settings (player X)', async () => {
    const game = new GameManager(mockAiClient, { playerMarker: 'X' });
    await game.startGame();

    const board = game.getBoard();
    assert.strictEqual(board.length, 3, 'Default board height should be 3');
    assert.strictEqual(board[0].length, 3, 'Default board width should be 3');
    assert.strictEqual(game.getCurrentPlayer(), 'X', 'Current player should be X initially');
    assert.strictEqual(game.isPlayerTurn(), true, 'Should be player X turn initially');
    assert.strictEqual(game.isGameOver(), false, 'Game should not be over initially');
    assert.strictEqual(game.getGameResult(), null, 'Game result should be null initially');
  });

  await t.test('should create a new game with player O (AI X goes first)', async () => {
    mockAiClient.setNextMove({ x: 0, y: 0 });
    const game = new GameManager(mockAiClient, { playerMarker: 'O' });
    await game.startGame();

    const board = game.getBoard();
    assert.strictEqual(board[0][0], 'X', 'AI (X) should have moved to 0,0');
    assert.strictEqual(game.getCurrentPlayer(), 'O', 'Current player should now be O');
    assert.strictEqual(game.isPlayerTurn(), true, 'Should be player O turn now');
    assert.strictEqual(game.isGameOver(), false);
  });

  await t.test('should allow player X move, then AI O moves', async () => {
    const game = new GameManager(mockAiClient, { playerMarker: 'X' });
    await game.startGame();

    mockAiClient.setNextMove({ x: 0, y: 0 });

    const moveResult = await game.makePlayerMove({ x: 1, y: 1 });
    assert.strictEqual(moveResult, true, 'Player move should be successful');

    const board = game.getBoard();
    assert.strictEqual(board[1][1], 'X', 'Player X should be at 1,1');
    assert.strictEqual(board[0][0], 'O', 'AI (O) should have moved to 0,0');
    assert.strictEqual(game.getCurrentPlayer(), 'X', 'Should be player X turn again');
    assert.strictEqual(game.isPlayerTurn(), true);
  });

  await t.test('should allow player O move after AI X first move', async () => {
    mockAiClient.setNextMove({ x: 0, y: 0 });
    const game = new GameManager(mockAiClient, { playerMarker: 'O' });
    await game.startGame();

    mockAiClient.setNextMove({ x: 2, y: 2 });

    const moveResult = await game.makePlayerMove({ x: 1, y: 1 });
    assert.strictEqual(moveResult, true, 'Player O move should be successful');

    const board = game.getBoard();
    assert.strictEqual(board[0][0], 'X', 'AI (X) initial move at 0,0');
    assert.strictEqual(board[1][1], 'O', 'Player O should be at 1,1');
    assert.strictEqual(board[2][2], 'X', 'AI (X) second move should be at 2,2');
    assert.strictEqual(game.getCurrentPlayer(), 'O', 'Should be player O turn again');
    assert.strictEqual(game.isPlayerTurn(), true);
  });

  await t.test('should prevent invalid moves (occupied cell)', async () => {
    const game = new GameManager(mockAiClient, { playerMarker: 'X' });
    await game.startGame();

    mockAiClient.setNextMove({ x: 0, y: 0 });
    await game.makePlayerMove({ x: 1, y: 1 });

    const invalidResultX = await game.makePlayerMove({ x: 1, y: 1 });
    assert.strictEqual(invalidResultX, false, 'Should not allow moving to player X spot');

    const invalidResultO = await game.makePlayerMove({ x: 0, y: 0 });
    assert.strictEqual(invalidResultO, false, 'Should not allow moving to AI O spot');

    assert.strictEqual(game.getCurrentPlayer(), 'X', 'Player should still be X');
  });

  await t.test('should prevent invalid moves (out of bounds)', async () => {
    const game = new GameManager(mockAiClient, { boardSize: 3, playerMarker: 'X' });
    await game.startGame();

    const results = await Promise.all([
      game.makePlayerMove({ x: 3, y: 0 }),
      game.makePlayerMove({ x: 0, y: 3 }),
      game.makePlayerMove({ x: -1, y: 0 }),
      game.makePlayerMove({ x: 0, y: -1 })
    ]);
    assert.ok(results.every(r => r === false), 'All out-of-bounds moves should fail');
  });

  await t.test('should prevent moves when not player turn', async () => {
    mockAiClient.setNextMove({ x: 0, y: 0 });
    const game = new GameManager(mockAiClient, { playerMarker: 'O' });
    await game.startGame();

    assert.strictEqual(game.isPlayerTurn(), true, "Sanity Check: Should be player O's turn");

    (game as any).playerMarker = 'X';

    const moveResult = await game.makePlayerMove({ x: 1, y: 1 });
    assert.strictEqual(moveResult, false, 'Move should fail when it is not the designated player marker turn');

    (game as any).playerMarker = 'O';
  });

  await t.test('should detect player win', async () => {
    const game = new GameManager(mockAiClient, { playerMarker: 'X' });
    await game.startGame();

    mockAiClient.queueMoves([
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 2, y: 1 }
    ]);

    await game.makePlayerMove({ x: 0, y: 0 });
    await game.makePlayerMove({ x: 1, y: 1 });
    await game.makePlayerMove({ x: 2, y: 2 });

    assert.strictEqual(game.isGameOver(), true, 'Game should be over after player win');
    assert.strictEqual(game.getGameResult(), 'PLAYER_WIN', 'Game result should be PLAYER_WIN');
  });

  await t.test('should detect AI win', async () => {
    const game = new GameManager(mockAiClient, { playerMarker: 'O' });
    mockAiClient.queueMoves([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ]);

    await game.startGame();
    assert.strictEqual(game.isGameOver(), false);

    await game.makePlayerMove({ x: 1, y: 1 });
    assert.strictEqual(game.isGameOver(), false);

    await game.makePlayerMove({ x: 2, y: 2 });

    assert.strictEqual(game.isGameOver(), true, 'Game should be over after AI win');
    assert.strictEqual(game.getGameResult(), 'AI_WIN', 'Game result should be AI_WIN');
  });


  await t.test('should detect draw', async () => {
     const gameDraw = new GameManager(mockAiClient, { playerMarker: 'X' });
     mockAiClient.queueMoves([
       { x: 1, y: 0 },
       { x: 1, y: 1 },
       { x: 2, y: 1 },
       { x: 0, y: 2 }
     ]);

     await gameDraw.startGame();
     await gameDraw.makePlayerMove({ x: 0, y: 0 });
     await gameDraw.makePlayerMove({ x: 0, y: 1 });
     await gameDraw.makePlayerMove({ x: 2, y: 0 });
     await gameDraw.makePlayerMove({ x: 1, y: 2 });
     await gameDraw.makePlayerMove({ x: 2, y: 2 });

     assert.strictEqual(gameDraw.isGameOver(), true, 'Game should be over after draw');
     assert.strictEqual(gameDraw.getGameResult(), 'DRAW', 'Game result should be DRAW');
   });


  await t.test('should allow restarting the game (player X starts)', async () => {
    const game = new GameManager(mockAiClient, { playerMarker: 'X' });
    await game.startGame();

    mockAiClient.setNextMove({ x: 0, y: 1 });
    await game.makePlayerMove({ x: 0, y: 0 });
    mockAiClient.setNextMove({ x: 2, y: 2 });
    await game.makePlayerMove({ x: 1, y: 1 });

    await game.restartGame();

    const board = game.getBoard();
    const isEmpty = board.flat().every(cell => cell === null);
    assert.strictEqual(isEmpty, true, 'Board should be empty after restart');
    assert.strictEqual(game.isGameOver(), false);
    assert.strictEqual(game.getGameResult(), null);
    assert.strictEqual(game.getCurrentPlayer(), 'X', 'Player should be X after restart');
    assert.strictEqual(game.isPlayerTurn(), true);
  });

  await t.test('should allow restarting the game (AI X starts)', async () => {
    const game = new GameManager(mockAiClient, { playerMarker: 'O' });

    mockAiClient.setNextMove({ x: 0, y: 0 });
    await game.startGame();
    mockAiClient.setNextMove({ x: 1, y: 1 });
    await game.makePlayerMove({ x: 2, y: 2 });

    mockAiClient.setNextMove({ x: 1, y: 0 });
    await game.restartGame();

    const board = game.getBoard();
    assert.strictEqual(board[0]?.[1], 'X', 'AI (X) should have made its first move to 1,0 after restart');
    const moveCount = board.flat().filter(c => c !== null).length;
    assert.strictEqual(moveCount, 1, 'Only one move should be on the board after restart');
    assert.strictEqual(game.isGameOver(), false);
    assert.strictEqual(game.getCurrentPlayer(), 'O', 'Should be player O turn after restart');
    assert.strictEqual(game.isPlayerTurn(), true);
  });


  await t.test('should support changing board size and restart', async () => {
    const game = new GameManager(mockAiClient, { playerMarker: 'X', boardSize: 3 });
    await game.startGame();
    await game.makePlayerMove({ x: 0, y: 0 });

    await game.changeBoardSize(5);

    const board = game.getBoard();
    assert.strictEqual(board.length, 5, 'Board height should be 5');
    assert.strictEqual(board[0].length, 5, 'Board width should be 5');
    const isEmpty = board.flat().every(cell => cell === null);
    assert.strictEqual(isEmpty, true, 'Board should be empty after resize');
    assert.strictEqual(game.isGameOver(), false);
    assert.strictEqual(game.getCurrentPlayer(), 'X');
    assert.strictEqual(game.isPlayerTurn(), true);
    assert.strictEqual((game as any).winLength, 5, 'Win length should default to 5 for 5x5');
  });

  await t.test('should support changing board size with specific win length', async () => {
    const game = new GameManager(mockAiClient, { boardSize: 3, playerMarker: 'X' });
    await game.startGame();

    await game.changeBoardSize(4, 3);

    const board = game.getBoard();
    assert.strictEqual(board.length, 4);
    assert.strictEqual(board[0].length, 4);
    assert.strictEqual((game as any).winLength, 3, 'Win length should be 3');
    assert.strictEqual(game.getCurrentPlayer(), 'X');
  });


  await t.test('should support changing player marker and restart (AI X moves first)', async () => {
    const game = new GameManager(mockAiClient, { playerMarker: 'X' });
    await game.startGame();
    await game.makePlayerMove({ x: 0, y: 0 });

    mockAiClient.setNextMove({ x: 1, y: 1 });
    await game.changePlayerMarker('O');

    const board = game.getBoard();
    assert.strictEqual(board[1]?.[1], 'X', 'AI (X) should have moved to 1,1 after marker change');
    assert.strictEqual(game.getCurrentPlayer(), 'O', 'Current player should be O');
    assert.strictEqual(game.isPlayerTurn(), true);
  });


  await t.test('should support changing difficulty and restart', async () => {
    const game = new GameManager(mockAiClient, { playerMarker: 'X', difficulty: 'easy' });
    await game.startGame();
    await game.makePlayerMove({ x: 0, y: 0 });

    await game.changeDifficulty('hard');

    assert.strictEqual((game as any).difficulty, 'hard', 'Difficulty should be updated');
    const board = game.getBoard();
    const isEmpty = board.flat().every(cell => cell === null);
    assert.strictEqual(isEmpty, true, 'Board should be empty after difficulty change');
    assert.strictEqual(game.isGameOver(), false);
    assert.strictEqual(game.getCurrentPlayer(), 'X');
    assert.strictEqual(game.isPlayerTurn(), true);
  });

  await t.test('should get a move using real AI Client via GameManager', { skip: !process.env.DEEPSEEK_API_KEY }, async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY!;
    const game = new GameManager(apiKey, { playerMarker: 'O' });

    await game.startGame();

    let initialBoard = game.getBoard();
    let aiFirstMove: Coordinate | null = null;
    let aiMoved = false;
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        if (initialBoard[y][x] === 'X') {
          aiMoved = true;
          aiFirstMove = { x, y };
          break;
        }
      }
      if (aiMoved) break;
    }
    assert.strictEqual(aiMoved, true, 'AI (X) should have made a move using the real client');
    console.log("Real AI Client's first move:", aiFirstMove);

    assert.strictEqual(game.isGameOver(), false);
    assert.strictEqual(game.getCurrentPlayer(), 'O');
    assert.strictEqual(game.isPlayerTurn(), true);

    let playerMoveCoord: Coordinate | null = null;
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            if (initialBoard[y][x] === null) {
                playerMoveCoord = { x, y };
                break;
            }
        }
        if (playerMoveCoord) break;
    }

    assert.ok(playerMoveCoord, "Should find a valid move for the player");
    console.log("Player (O) attempting valid move at:", playerMoveCoord);

    const playerMoveSuccess = await game.makePlayerMove(playerMoveCoord);
    assert.ok(playerMoveSuccess, `Player move to ${JSON.stringify(playerMoveCoord)} should succeed`);

    const boardAfterPlayer = game.getBoard();
    const moveCount = boardAfterPlayer.flat().filter(c => c !== null).length;
    assert.strictEqual(moveCount, 3, "Should be 3 moves on the board (AI, Player, AI)");

    let aiSecondMoveCoord: Coordinate | null = null;
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const isAIFirstMove = aiFirstMove && x === aiFirstMove.x && y === aiFirstMove.y;
        const isPlayerMove = playerMoveCoord && x === playerMoveCoord.x && y === playerMoveCoord.y;
        if (boardAfterPlayer[y][x] === 'X' && !isAIFirstMove) {
             aiSecondMoveCoord = { x, y };
             break;
        }
      }
      if (aiSecondMoveCoord) break;
    }
    console.log("Real AI Client's second move:", aiSecondMoveCoord);
    assert.ok(aiSecondMoveCoord, "AI should have made a second move");
    assert.notDeepStrictEqual(aiSecondMoveCoord, aiFirstMove, "AI's second move should be different from its first");

  });

});
