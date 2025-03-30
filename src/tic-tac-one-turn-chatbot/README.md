# Tic Tac Toe with AI

A dynamic Tic Tac Toe game with configurable board sizes, win conditions, and an AI opponent using the DeepSeek API (or a fallback).

## Features

-   **Dynamic Board Size**: Play on 3x3, 4x4, 5x5, or larger boards.
-   **Configurable Win Length**: Set the number of markers needed in a row to win (e.g., 3-in-a-row on 5x5).
-   **AI Opponent**: Uses the DeepSeek API for potentially intelligent moves (requires API key). Falls back to basic logic if no key is provided.
-   **Adjustable Difficulty**: Influence AI strategy (primarily affects API prompts or fallback logic).
-   **Choose Your Marker**: Play as 'X' (goes first) or 'O'.

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd tic-tac-one-turn-chatbot

# Install dependencies
npm install

# Set up environment variables (optional but recommended for AI)
cp .env.example .env
# Edit .env to add your DeepSeek API key (DEEPSEEK_API_KEY=...)
# You can also optionally specify a model (e.g., DEEPSEEK_MODEL=deepseek-coder)
Quick Start Example (Console Game)
Bash

# Ensure you have built the project first:
npm run build

# Run the interactive console game:
# Using tsx (development):
npm run play
# Using compiled JS (production):
node dist/examples/play-game.js # Adjust path if needed
This will launch an interactive game in your terminal where you can configure the board size, win length, marker, and difficulty.

Usage (as a Library)
Basic Usage
TypeScript

import { GameManager } from 'tic-tac-one-turn-chatbot';
import { formatBoard } from 'tic-tac-one-turn-chatbot'; // Use exported helper
import * as dotenv from 'dotenv';

dotenv.config(); // Load .env file for API key

// Create a new game with default settings (3x3 board, player X)
// Provide API key from environment or pass AI client instance
const apiKey = process.env.DEEPSEEK_API_KEY;
const game = new GameManager(apiKey || 'fallback'); // Use API key or let it use fallback AI

// Start the game (handles potential first AI move if AI is X)
await game.startGame();

// Display the board
console.log(formatBoard(game.getBoard()));

// Check whose turn it is
if (game.isPlayerTurn()) {
  // Make a move (0-indexed coordinates)
  const success = await game.makePlayerMove({ x: 1, y: 1 });
  if (success) {
    console.log("Move successful!");
    console.log(formatBoard(game.getBoard()));
  } else {
    console.log("Invalid move!");
  }
}

// Check if game is over
if (game.isGameOver()) {
  console.log('Game over!');
  console.log('Result:', game.getGameResult());
}
Advanced Configuration
TypeScript

import { GameManager } from 'tic-tac-one-turn-chatbot';
import * as dotenv from 'dotenv';

dotenv.config();
const apiKey = process.env.DEEPSEEK_API_KEY;

// Create a 5x5 game where player is O, AI is X, with 4 in a row to win, hard difficulty
const game = new GameManager(apiKey || 'fallback', {
  boardSize: 5,
  playerMarker: 'O', // AI will be 'X' and go first
  difficulty: 'hard',
  winLength: 4      // Need 4 in a row to win
});

// Start the game (AI will make the first move)
await game.startGame();
console.log("AI (X) made its first move:");
console.log(formatBoard(game.getBoard()));

// --- Later in the game ---

// Change board size and restart (defaults win length, player marker remains O)
await game.changeBoardSize(4); // 4x4 board, win length 4 (default for >=4), AI X starts

// Change difficulty and restart
await game.changeDifficulty('easy'); // AI X starts the new game

// Change player marker back to X and restart
await game.changePlayerMarker('X'); // Player X starts the new game

// Restart the game with current settings
await game.restartGame();
API Reference
GameManager
The main class for managing the game state and flow.

TypeScript

class GameManager {
  // Constructor requires an AIClient instance or an API key string
  constructor(aiClientOrApiKey: BaseAIClient | string, options?: Partial<GameOptions>);

  // Starts/initializes the game, handling the first move if AI is X. Call after constructor.
  startGame(): Promise<void>;

  // --- Game state methods ---
  getBoard(): Board; // Returns a deep copy of the board
  getCurrentPlayer(): PlayerMarker; // Gets the marker of the player whose turn it is
  isPlayerTurn(): boolean; // Checks if it's the human player's turn
  isGameOver(): boolean; // Checks if the game has ended
  getGameResult(): GameResult | null; // Returns 'PLAYER_WIN', 'AI_WIN', 'DRAW', or null

  // --- Game action methods ---
  // Attempts to make a move for the human player. Returns true if successful.
  // Automatically triggers the AI's move if the game continues.
  makePlayerMove(coord: Coordinate): Promise<boolean>;

  // Resets the board and game state, keeping current settings. Restarts the game.
  restartGame(): Promise<void>;

  // Changes board size, optionally win length, and restarts the game.
  changeBoardSize(newSize: number, winLength?: number): Promise<void>;

  // Changes AI difficulty and restarts the game.
  changeDifficulty(difficulty: Difficulty): Promise<void>;

  // Changes the human player's marker ('X' or 'O') and restarts the game.
  changePlayerMarker(marker: PlayerMarker): Promise<void>;
}
Types and Interfaces
TypeScript

// From tic-tac-types package (or re-exported)
type PlayerMarker = 'X' | 'O';
type Board = (PlayerMarker | null)[][];
interface Coordinate { x: number; y: number; }

// Defined in this package
type Difficulty = 'easy' | 'medium' | 'hard';
type GameResult = 'PLAYER_WIN' | 'AI_WIN' | 'DRAW' | null;

interface GameOptions {
  boardSize: number;      // e.g., 3, 4, 5
  playerMarker: PlayerMarker; // 'X' or 'O'
  difficulty: Difficulty;   // 'easy', 'medium', 'hard'
  winLength: number;      // e.g., 3, 4, 5 (must be <= boardSize)
}

// AI Client Interface (implemented by DeepSeekAdapter, SimpleAIClient)
interface AIClient {
  getNextMove(board: Board, difficulty: Difficulty): Promise<Coordinate>;
}

// Prompt Provider Interface (used by DeepSeekAdapter)
interface PromptProvider {
  createPrompt(
    formattedBoard: string,
    aiMarker: PlayerMarker,
    humanMarker: PlayerMarker,
    difficulty: string,
    size: number
  ): string;
}
Development
Bash

# Run tests
npm test

# Build the project (compiles TS to JS in dist/)
npm run build

# Type check
npm run typecheck:backend

# Run the interactive console game example (using tsx for development)
npm run play
License
ISC
