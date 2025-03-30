# Tic-Tac-Toe AI Clients

A TypeScript package providing AI opponents for Tic-Tac-Toe games, supporting variable board sizes and difficulty levels.

## Features

- Multiple AI implementations:
  - `SimpleAIClient`: Local algorithmic AI with basic strategy
  - `DeepSeekAdapter`: LLM-powered AI using DeepSeek API
- Variable board sizes (3x3 and larger)
- Three difficulty levels: easy, medium, and hard
- Smart prompt strategies for LLM-based opponents
- Fallback mechanisms for reliability

## Installation

```bash
npm install tic-tac-toe-ai-clients
```

## Dependencies

This package depends on the following packages:
- `tic-tac-types`: Common type definitions
- `tic-tac-valid`: Validation utilities
- `tic-tac-winner`: Win condition detection

## Usage

### Basic Usage

```typescript
import { AIClientFactory } from 'tic-tac-toe-ai-clients';

// Create a client with no API key (uses SimpleAIClient)
const simpleClient = AIClientFactory.createClient({});

// Creating a 3x3 Tic-Tac-Toe board
const board = [
  [null, null, null],
  [null, 'X', null],
  [null, null, null]
];

// Get AI move (returns a Promise with Coordinate {x, y})
const move = await simpleClient.getNextMove(board, 'medium');
console.log(`AI chose: (${move.x}, ${move.y})`);
```

### Using DeepSeek Adapter

```typescript
import { AIClientFactory } from 'tic-tac-toe-ai-clients';

// Set up with DeepSeek API (requires API key)
const aiClient = AIClientFactory.createClient({
  apiKey: 'your-deepseek-api-key',
  model: 'deepseek-coder' // Optional, defaults to 'deepseek-coder'
});

// Get advanced AI move
const aiMove = await aiClient.getNextMove(board, 'hard');
```

### Custom Difficulty Levels

```typescript
// Easy mode - makes more random moves
const easyMove = await aiClient.getNextMove(board, 'easy');

// Medium mode - balance of strategy and occasional mistakes
const mediumMove = await aiClient.getNextMove(board, 'medium');

// Hard mode - plays optimally
const hardMove = await aiClient.getNextMove(board, 'hard');
```

### Larger Boards

```typescript
// Creating a 5x5 board
const largeBoard = Array(5).fill(null).map(() => Array(5).fill(null));
// Some moves already made...
largeBoard[2][2] = 'X';
largeBoard[1][1] = 'O';

// AI handles larger boards automatically
const move = await aiClient.getNextMove(largeBoard, 'medium');
```

## API Reference

### AIClientFactory

The main entry point for creating AI clients.

```typescript
AIClientFactory.createClient(config: {
  apiKey?: string;  // DeepSeek API key
  adapter?: string; // Future use
  model?: string;   // Model name for DeepSeek
}): BaseAIClient
```

### BaseAIClient 

Abstract class that implements `AIClient` interface.

```typescript
interface AIClient {
  getNextMove(board: Board, difficulty: Difficulty): Promise<Coordinate>;
}
```

Where:
- `Board` is a 2D array of cells (`null | 'X' | 'O'`)
- `Difficulty` is `'easy' | 'medium' | 'hard'`
- `Coordinate` is `{ x: number, y: number }`
