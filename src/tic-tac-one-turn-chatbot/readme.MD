# Tic-Tac-One-Turn-Chatbot

A NodeJS package for creating Tic-Tac-Toe games with an AI opponent powered by DeepSeek API.

## Features

- Play Tic-Tac-Toe against an AI opponent
- Configurable board sizes (3x3, 4x4, 5x5, etc.)
- Adjustable win conditions (3, 4, or 5 in a row)
- Multiple difficulty levels for the AI
- Choose to play as X or O
- TypeScript support with type definitions

## Installation

```bash
npm install tic-tac-one-turn-chatbot
```

## Quick Start

```javascript
import { GameManager } from 'tic-tac-one-turn-chatbot';
import dotenv from 'dotenv';

// Load DeepSeek API key from .env file
dotenv.config();

// Create a new game with default settings (3x3 board, player as X)
const game = new GameManager(process.env.DEEPSEEK_API_KEY, {
  boardSize: 3,      // 3x3 board
  playerMarker: 'X', // Player plays as X
  difficulty: 'medium',
  winLength: 3       // 3 in a row to win
});

// Initialize the game (AI will move first if AI is X)
await game.startGame();

// Make a player move
await game.makePlayerMove({ x: 1, y: 1 });

// Check game state after move
console.log(game.getBoard());
console.log('Game over?', game.isGameOver());
console.log('Result:', game.getGameResult());
```

## Configuration

### Game Options

```javascript
const options = {
  boardSize: 3,        // Size of the board (3 for 3x3, 4 for 4x4, etc.)
  playerMarker: 'X',   // 'X' or 'O'
  difficulty: 'medium', // 'easy', 'medium', or 'hard'
  winLength: 3         // Number of consecutive marks needed to win
};

const game = new GameManager(apiKey, options);
```

### Environment Variables

Create a `.env` file with your DeepSeek API key:

```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-coder  # Optional
```

## API Reference

### GameManager

The main class for managing the game state.

#### Constructor

```javascript
new GameManager(apiKeyOrClient, options)
```

- `apiKeyOrClient`: DeepSeek API key string or an instance of BaseAIClient
- `options`: Game configuration options

#### Methods

- `startGame()`: Initialize the game, making the first AI move if needed
- `makePlayerMove(coord)`: Make a move at the specified coordinates
- `getBoard()`: Get the current board state
- `getCurrentPlayer()`: Get the current player marker ('X' or 'O')
- `isPlayerTurn()`: Check if it's the human player's turn
- `isGameOver()`: Check if the game is over
- `getGameResult()`: Get the game result ('PLAYER_WIN', 'AI_WIN', 'DRAW', or null)
- `restartGame()`: Reset the game with the same settings
- `changeBoardSize(newSize, winLength)`: Change the board size and optionally the win length
- `changeDifficulty(difficulty)`: Change the AI difficulty
- `changePlayerMarker(marker)`: Change the player's marker

## Example: Command Line Game

```javascript
import { GameManager, formatBoard } from 'tic-tac-one-turn-chatbot';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const apiKey = process.env.DEEPSEEK_API_KEY;
const game = new GameManager(apiKey);

async function play() {
  await game.startGame();
  console.log('Game started!');
  console.log(formatBoard(game.getBoard()));
  
  if (game.isPlayerTurn()) {
    promptMove();
  }
}

function promptMove() {
  rl.question('Enter move (x,y): ', async (input) => {
    const [x, y] = input.split(',').map(n => parseInt(n.trim()));
    const success = await game.makePlayerMove({ x, y });
    
    if (!success) {
      console.log('Invalid move! Try again.');
      promptMove();
      return;
    }
    
    console.log(formatBoard(game.getBoard()));
    
    if (game.isGameOver()) {
      console.log('Game over! Result:', game.getGameResult());
      rl.close();
    } else {
      promptMove();
    }
  });
}

play().catch(console.error);
```

## License

ISC

## Dependencies

- tic-tac-types
- tic-tac-valid
- tic-tac-winner
- tic-tac-toe-ai-clients