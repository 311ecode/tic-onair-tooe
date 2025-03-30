import { Board, Coordinate, PlayerMarker } from 'tic-tac-types';
import { isValidBoardState, getNextPlayer } from 'tic-tac-valid';
import { checkWinner } from 'tic-tac-winner';
import {
  createEmptyBoard,
  makeMove,
  isValidMove,
  getGameState,
  getValidMoves
} from './game-board.js';
import {
  BaseAIClient,
  AIClientFactory,
  Difficulty,
  AIClient
} from 'tic-tac-toe-ai-clients';

export interface GameOptions {
  boardSize: number;
  playerMarker: PlayerMarker;
  difficulty: Difficulty;
  winLength: number;
}

export type GameResult = 'PLAYER_WIN' | 'AI_WIN' | 'DRAW' | null;

export class GameManager {
  private board: Board;
  private aiClient: BaseAIClient;
  private difficulty: Difficulty;
  private gameOver: boolean;
  private boardSize: number;
  private playerMarker: PlayerMarker;
  private aiMarker: PlayerMarker;
  private winLength: number;

    constructor(
    aiClientOrApiKey: BaseAIClient | string,
    options: Partial<GameOptions> = {}
  ) {
    this.boardSize = options.boardSize ?? 3;
    this.playerMarker = options.playerMarker ?? 'X';
    this.aiMarker = this.playerMarker === 'X' ? 'O' : 'X';
    this.difficulty = options.difficulty ?? 'medium';
    this.winLength = options.winLength ?? (this.boardSize === 3 ? 3 : Math.min(this.boardSize, 5));

    if (this.winLength < 3 || this.winLength > this.boardSize) {
      throw new Error(`Win length must be between 3 and ${this.boardSize}`);
    }

    this.board = createEmptyBoard(this.boardSize);
    this.gameOver = false;

    if (typeof aiClientOrApiKey === 'string') {
      this.aiClient = AIClientFactory.createClient({
        apiKey: aiClientOrApiKey,
        model: process.env.AI_MODEL
      });
    } else if (aiClientOrApiKey instanceof BaseAIClient) {
      this.aiClient = aiClientOrApiKey;
    } else {
      throw new Error("Invalid aiClientOrApiKey provided. Must be an API key string or an instance of BaseAIClient.");
    }

  }

    async startGame(): Promise<void> {
    if (this.aiMarker === 'X' && !this.gameOver) {
      await this.makeAIMove();
    }
  }

    getBoard(): Board {
    return this.board.map(row => [...row]);
  }

    getCurrentPlayer(): PlayerMarker {
    if (this.gameOver) {
      return getNextPlayer(this.board);
    }
    return getNextPlayer(this.board);
  }

    isPlayerTurn(): boolean {
    return !this.gameOver && this.getCurrentPlayer() === this.playerMarker;
  }

    isGameOver(): boolean {
    return this.gameOver;
  }

    async makePlayerMove(coord: Coordinate): Promise<boolean> {
    if (this.gameOver || !this.isPlayerTurn()) {
      console.warn(`Player move blocked: Game Over? ${this.gameOver}, Is Player Turn? ${this.isPlayerTurn()}`);
      return false;
    }

    if (!isValidMove(this.board, coord)) {
      console.warn(`Invalid player move coordinates or cell occupied: ${JSON.stringify(coord)}`);
      return false;
    }

    try {
      this.board = makeMove(this.board, coord, this.playerMarker);
      this.checkGameState();

      if (!this.gameOver && this.getCurrentPlayer() === this.aiMarker) {
        await this.makeAIMove();
      }
      return true;
    } catch (error) {
      console.error('Error making player move:', error);
      return false;
    }
  }

    private async makeAIMove(): Promise<void> {
    if (this.gameOver || this.getCurrentPlayer() !== this.aiMarker) {
      console.warn(`AI Move blocked: Game Over? ${this.gameOver}, Is AI Turn? ${this.getCurrentPlayer() === this.aiMarker}`);
      return;
    }

    try {
      const aiMove = await this.aiClient.getNextMove(
        this.board,
        this.difficulty
      );

      if (isValidMove(this.board, aiMove)) {
        this.board = makeMove(this.board, aiMove, this.aiMarker);
        this.checkGameState();
      } else {
        console.error(`AI client proposed an invalid move: ${JSON.stringify(aiMove)}. Board:
${JSON.stringify(this.board)}`);
        const validMoves = getValidMoves(this.board);
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          console.warn(`AI failed/invalid, falling back to random move: ${JSON.stringify(randomMove)}`);
          this.board = makeMove(this.board, randomMove, this.aiMarker);
          this.checkGameState();
        } else {
          this.checkGameState();
          if (!this.gameOver) {
            console.error("AI proposed invalid move, no valid moves left, forcing game over.");
            this.gameOver = true;
          }
        }
      }
    } catch (error) {
      console.error('Error during AI move execution:', error);
      console.warn('AI client failed. Attempting fallback random move.');
      const validMoves = getValidMoves(this.board);
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        console.warn(`Falling back to random move: ${JSON.stringify(randomMove)}`);
        this.board = makeMove(this.board, randomMove, this.aiMarker);
        this.checkGameState();
      } else if (!this.gameOver) {
        this.checkGameState();
        if (!this.gameOver) {
          this.gameOver = true;
          console.error("AI failed, no valid moves left, forcing game over.");
        }
      }
    }
  }

    private checkGameState(): void {
    if (this.gameOver) return;

    const state = getGameState(this.board, this.winLength);
    if (state !== 'IN_PROGRESS') {
      this.gameOver = true;
    }
  }

    getGameResult(): GameResult {
    if (!this.gameOver) {
      return null;
    }
    const state = getGameState(this.board, this.winLength);
    switch (state) {
      case 'X_WIN':
        return this.playerMarker === 'X' ? 'PLAYER_WIN' : 'AI_WIN';
      case 'O_WIN':
        return this.playerMarker === 'O' ? 'PLAYER_WIN' : 'AI_WIN';
      case 'DRAW':
        return 'DRAW';
      default:
        console.warn("getGameResult: Game is over but state is IN_PROGRESS.");
        return null;
    }
  }

    async restartGame(): Promise<void> {
    this.board = createEmptyBoard(this.boardSize);
    this.gameOver = false;
    await this.startGame();
  }

    async changeBoardSize(newSize: number, winLength?: number): Promise<void> {
    if (newSize < 3) throw new Error('Board size must be at least 3');
    this.boardSize = newSize;

    if (winLength !== undefined) {
      if (winLength < 3 || winLength > newSize) {
        throw new Error(`Win length must be between 3 and ${newSize}`);
      }
      this.winLength = winLength;
    } else {
      this.winLength = newSize === 3 ? 3 : Math.min(newSize, 5);
    }
    await this.restartGame();
  }

    async changeDifficulty(difficulty: Difficulty): Promise<void> {
    this.difficulty = difficulty;
    await this.restartGame();
  }

    async changePlayerMarker(marker: PlayerMarker): Promise<void> {
    if (marker !== 'X' && marker !== 'O') {
      throw new Error("Invalid player marker. Must be 'X' or 'O'.");
    }
    this.playerMarker = marker;
    this.aiMarker = marker === 'X' ? 'O' : 'X';
    await this.restartGame();
  }
}

