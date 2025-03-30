# tic-tac-board-hash

A lightweight, efficient library for generating consistent identifiers for Tic-Tac-Toe boards.

## Overview

This library provides a reliable way to generate unique identifiers for Tic-Tac-Toe game boards. Unlike storing and comparing entire board states, `tic-tac-board-hash` creates consistent hash identifiers that:

- Always produce the same identifier for identical board states
- Generate different identifiers for different board states
- Provide a compact, string representation of any board configuration

## Installation

```bash
npm install tic-tac-board-hash
```

## Usage

The library exports several functions to handle different hashing scenarios:

```javascript
import { 
  hashBoard, 
  hashBoardSHA1, 
  hashBoardMD5, 
  hashBoardStructure 
} from 'tic-tac-board-hash';
```

### Basic Usage

```javascript
import { hashBoardSHA1 } from 'tic-tac-board-hash';

// A 3x3 Tic-Tac-Toe board
const gameBoard = [
  ['X', null, 'O'],
  [null, 'X', null],
  ['O', null, 'X']
];

// Get a unique identifier for this board
const boardId = hashBoardSHA1(gameBoard);
console.log(boardId); // 'f23a7c1d...' (unique, consistent hash)
```

### Key Features

#### Guaranteed Consistency

The same board will always generate the same identifier, making it perfect for:

- Board state caching
- Game history tracking
- Position evaluation memoization
- Board comparison without deep equality checks

#### Multiple Hash Options

Choose the hash algorithm that best fits your needs:

```javascript
// Using SHA1 (default, longer but more collision-resistant)
const id1 = hashBoardSHA1(gameBoard);

// Using MD5 (shorter, still very reliable for Tic-Tac-Toe boards)
const id2 = hashBoardMD5(gameBoard);
```

#### Customization Options

The `hashBoard` function provides several options for customizing the hash behavior:

```javascript
import { hashBoard } from 'tic-tac-board-hash';

const customHash = hashBoard(gameBoard, {
  algorithm: 'sha1',       // 'sha1', 'md5', or 'passthrough'
  encoding: 'hex',         // 'hex', 'base64', 'buffer', or 'binary'
  excludeValues: false,    // Only hash structure, not X/O values
  normalize: true          // Sort board for consistent hashing of equivalent positions
});
```

#### Structure-Only Hashing

If you only care about which cells are filled (regardless of X or O):

```javascript
import { hashBoardStructure } from 'tic-tac-board-hash';

// This will produce the same hash for boards with the same
// pattern of filled/empty cells, regardless of X/O values
const structureId = hashBoardStructure(gameBoard);
```

## Applications

- **Game State Management**: Efficiently cache and recall board evaluations
- **Move History**: Track board states without storing full boards
- **Game Tree Analysis**: Identify duplicate board positions in search algorithms
- **Board Comparison**: Check if two boards are identical without deep comparison

## Types

The library uses types from the `tic-tac-types` package:

```typescript
import { Board, PlayerMarker } from 'tic-tac-types';

// Board is a 2D array of PlayerMarker | null
// PlayerMarker is 'X' | 'O'
```

## How It Works

Behind the scenes, `tic-tac-board-hash` uses a deterministic hashing algorithm to convert board states into consistent identifiers. This means:

- The same board always produces the same identifier
- Different boards produce different identifiers (with extremely high probability)
- The hash is compact and efficient to store/compare