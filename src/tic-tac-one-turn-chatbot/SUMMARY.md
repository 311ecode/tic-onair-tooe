# Tic Tac Toe AI Project Summary

## Project Overview

We've built a dynamic Tic Tac Toe game with the following features:

1. **Dynamic Board Size**: Support for 3x3, 4x4, 5x5, or any custom size grid
2. **Custom Win Conditions**: Configurable win length (number of markers in a row to win)
3. **AI Opponent**: Integration with DeepSeek API for intelligent moves
4. **Difficulty Levels**: Easy, medium, and hard AI difficulty options
5. **Player Configuration**: Choose to play as X or O, and whether AI goes first

## Architecture

The project is structured with several key components:

### Core Components

1. **game-board.ts**: Provides functions for board manipulation and game state detection
2. **game-manager.ts**: Manages the game flow, player turns, and coordinates with the AI
3. **deepseek-client.ts**: Handles communication with the DeepSeek API for AI moves

### External Dependencies

- **tic-tac-types**: Types for the board and game elements
- **tic-tac-valid**: Validates board states and determines player turns
- **tic-tac-winner**: Checks for win conditions on the board

### Example Implementations

- **simple-game.ts**: A basic implementation of the game in the console
- **advanced-game.ts**: A more feature-rich implementation with better UX

## DeepSeek AI Integration

The AI uses the DeepSeek API to determine the best move based on:

1. Current board state
2. Selected difficulty level
3. Win condition length
4. Board size

The API sends the board state to DeepSeek along with a prompt that explains the game rules and asks for the best move. The AI analyses the board and returns coordinates for its next move.

## Usage Examples

### Basic Usage

```typescript
import { GameManager } from 'tic-tac-one-turn-chatbot';

// Create a game with default settings (3x3 board)
const game = new GameManager(apiKey);

// Make a player move
await game.makePlayerMove({ x: 1, y: 1 });

// Check game state
if (game.isGameOver()) {
  console.log('Game result:', game.getGameResult());
}
```

### Advanced Configuration

```typescript
// Create a 5x5 game with 4 in a row to win
const game = new GameManager(apiKey, {
  boardSize: 5,
  playerMarker: 'O',
  aiFirst: true,
  difficulty: 'hard',
  winLength: 4
});
```

## Running the Examples

The project includes two runnable examples:

1. Simple game: `npm run example:simple`
2. Advanced game: `npm run example:advanced`

Both examples provide a console-based interface to play the game.

## Future Enhancements

Potential future improvements include:

1. Web-based UI implementation
2. Saving and loading game states
3. Game replay/history functionality
4. Additional AI capabilities (learning from player moves)
5. Multiplayer support
