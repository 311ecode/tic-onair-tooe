# Tic-Tac-Valid

A TypeScript package for validating Tic-Tac-Toe game boards and moves.

## Description

This package provides utilities for validating Tic-Tac-Toe game states and moves. It helps ensure that your game logic remains consistent by verifying:
- Valid board states (correct number of X's and O's)
- Which player's turn is next
- Valid move coordinates

Works seamlessly with the `tic-tac-types` package for TypeScript type definitions.

## Installation

```bash
npm install tic-tac-valid
```

Note: This package depends on `tic-tac-types`, which will be installed automatically as a dependency.

## Usage

Import the validation functions in your project:

```typescript
import { isValidBoardState, getNextPlayer, validateMove } from 'tic-tac-valid';
import { Board, Coordinate } from 'tic-tac-types';

// Create a game board
const board: Board = [
  [null, null, null],
  [null, 'X', null],
  [null, null, 'O']
];

// Check if the board is in a valid state
if (isValidBoardState(board)) {
  console.log('Board is valid!');
} else {
  console.log('Board is invalid!');
}

// Determine whose turn it is
const nextPlayer = getNextPlayer(board);
console.log(`It's ${nextPlayer}'s turn!`);

// Validate a move before applying it
const move: Coordinate = { x: 0, y: 0 };
try {
  validateMove(board, move);
  console.log('Move is valid!');
  
  // Apply the move (not provided by this package)
  board[move.y][move.x] = nextPlayer;
} catch (error) {
  console.error(`Invalid move: ${error.message}`);
}
```

## API Reference

### `isValidBoardState(board: Board): boolean`

Checks if a Tic-Tac-Toe board state is valid according to the rules:
- X always goes first
- The number of X's should be equal to or one more than the number of O's

Parameters:
- `board`: The game board to validate

Returns:
- `boolean`: true if the board is in a valid state, false otherwise

### `getNextPlayer(board: Board): PlayerMarker`

Determines which player's turn it is based on the current board state.

Parameters:
- `board`: The current game board

Returns:
- `PlayerMarker`: 'X' or 'O' indicating whose turn it is

### `validateMove(board: Board, coord: Coordinate): void`

Validates if a move is valid for the given board. Throws an error if the move is invalid.

Parameters:
- `board`: The current board state
- `coord`: The coordinates where the player wants to make a move

Throws:
- `Error`: If the move is invalid (out of bounds, cell already occupied, or invalid board)

## Development

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd tic-tac-valid
npm install
```

Available scripts:

- `npm run build`: Build the package
- `npm test`: Run tests
- `npm run typecheck:backend`: Run TypeScript type checking
- `npm run dev:backend`: Watch mode for development

## License

ISC