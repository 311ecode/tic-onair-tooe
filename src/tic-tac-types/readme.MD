# Tic-Tac-Types

A TypeScript package providing shared type definitions for Tic-Tac-Toe projects.

## Description

This package contains common TypeScript interfaces and types for building Tic-Tac-Toe applications. It helps ensure type consistency across your frontend and backend code when working with game boards, player markers, and coordinates.

## Installation

```bash
npm install tic-tac-types
```

## Usage

Import the types in your project:

```typescript
import { Board, Cell, Coordinate, PlayerMarker } from 'tic-tac-types';

// Create a new game board
const board: Board = [
  [null, null, null],
  [null, null, null],
  [null, null, null]
];

// Set a player marker
const marker: PlayerMarker = 'X';

// Make a move
const move: Coordinate = { x: 1, y: 1 };
board[move.y][move.x] = marker;
```

## Types

- `PlayerMarker`: Represents a player marker ('X' or 'O')
- `Cell`: Represents a cell in the game board (PlayerMarker or null)
- `Board`: 2D array of Cells representing the game board
- `Coordinate`: Interface for board positions with x and y properties

## Development

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd tic-tac-types
npm install
```

Available scripts:

- `npm run build`: Build the package
- `npm run typecheck`: Run TypeScript type checking
- `npm test`: Run tests
- `npm run build:backend:watch`: Watch mode for development
