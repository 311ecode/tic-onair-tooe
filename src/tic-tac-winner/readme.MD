# Tic-Tac-Winner

A TypeScript package for checking winning conditions in Tic-Tac-Toe games.

## Description

This package provides utilities for detecting winning patterns in Tic-Tac-Toe game boards of various sizes. It's designed to work with the `tic-tac-types` and `tic-tac-valid` packages, offering a complete solution for handling Tic-Tac-Toe game logic.

Key features:
- Support for variable board sizes (3x3, 10x10, etc.)
- Customizable win length (3-in-a-row, 5-in-a-row, etc.)
- Detection of horizontal, vertical, and diagonal winning patterns
- Validation of game board states
- Optimized for performance

## Installation

```bash
npm install tic-tac-winner
```

Note: This package depends on `tic-tac-types` and `tic-tac-valid`, which will be installed automatically as dependencies.

## Usage

Import the winner detection function in your project:

```typescript
import { checkWinner } from 'tic-tac-winner';
import { Board, PlayerMarker } from 'tic-tac-types';

// Create a game board
const board: Board = [
  ['X', 'X', 'X'],
  [null, 'O', null],
  [null, 'O', null]
];

// Check if there's a winner (default win length is 3)
const winner: PlayerMarker | null = checkWinner(board);

if (winner) {
  console.log(`Player ${winner} wins!`);
} else {
  console.log('No winner yet!');
}
```

### Custom Board Sizes and Win Lengths

For larger board sizes with different win requirements:

```typescript
import { checkWinner } from 'tic-tac-winner';
import { Board } from 'tic-tac-types';

// Create a 10x10 board
const largeBoard: Board = Array(10).fill(null).map(() => Array(10).fill(null));

// Set up a winning pattern (5 in a row)
for (let i = 0; i < 5; i++) {
  largeBoard[2][i] = 'X';
}

// Check for a winner with win length of 5
const winner = checkWinner(largeBoard, 5);
console.log(`Winner: ${winner}`); // Output: Winner: X
```

## API Reference

### `checkWinner(board: Board, winLength: number = 3, skipValidation: boolean = false): PlayerMarker | null`

Checks if there's a winner in the Tic-Tac-Toe game.

Parameters:
- `board`: The game board to check
- `winLength`: Number of consecutive markers needed to win (default: 3)
- `skipValidation`: Optional flag to skip board validation for testing (default: false)

Returns:
- `PlayerMarker | null`: The winning player marker ('X' or 'O') or null if no winner

## Board Validation

By default, `checkWinner` validates that the board represents a valid game state using the `tic-tac-valid` package. This ensures that:
- X always goes first
- The number of X's is equal to or one more than the number of O's

If you want to skip validation (for example, in testing), you can pass `skipValidation: true`:

```typescript
const winner = checkWinner(board, 3, true);
```

