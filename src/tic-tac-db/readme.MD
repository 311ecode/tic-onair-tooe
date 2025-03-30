# Tic-Tac-DB

A database module for storing and retrieving Tic Tac Toe game results.

## Overview

This package provides a SQLite database implementation for storing game results, win states, and other related data for Tic Tac Toe games. It uses [Drizzle ORM](https://orm.drizzle.team/) for database interactions and migrations.

## Installation

```bash
npm install tic-tac-db
```

## Environment Variables

The module uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_PATH` | Path to the SQLite database file | If not set, a temporary file will be created in the OS temp directory |
| `RUNTIME_DATABASE_PATH` | Internal variable for tracking database path during runtime | Set automatically by the module |

Create a `.env` file in your project root to configure these variables:

```
# Path to SQLite database file
DATABASE_PATH="./data/tic-tac-toe.db"
```

## Database Schema

The current schema includes:

- `win_states`: Records of completed games with winning states

## Updating Schema & Migrations

### 1. Modify Schema Definition

To update the database schema, edit the `src/backend/db/schema.ts` file:

```typescript
// Example: Adding a new field to win_states table
export const win_states = sqliteTable('win_states', {
  // Existing fields...
  
  // New field
  gameMode: text('game_mode').notNull().default('standard'),
});
```

### 2. Generate Migration

After modifying the schema, generate a migration file:

```bash
npm run db:generate
```

This command uses Drizzle Kit to create migration files in the `drizzle/migrations` directory.

### 3. Apply Migration

Apply the generated migration to your database:

```bash
npm run db:migrate
```

## Usage

### Basic Usage

```typescript
import { 
  storeGameResult, 
  getAllCompletedGames, 
  getGameResultByHash,
  runDbMigrations 
} from 'tic-tac-db';

// Apply migrations when your application starts
runDbMigrations();

// Store a game result
const result = await storeGameResult(
  'game-hash-123',
  [['X', 'X', 'X'], ['O', 'O', null], [null, null, null]],
  'X',
  3
);

// Get all completed games
const games = await getAllCompletedGames();

// Get a specific game by hash
const game = await getGameResultByHash('game-hash-123');
```

### Direct Access

For advanced use cases, you can use direct access methods:

```typescript
import { insertWinStateDirect, getAllWinStatesDirect } from 'tic-tac-db/src/backend/db/directAccess';

// Insert directly (throws on duplicate)
await insertWinStateDirect({
  boardHash: 'unique-hash',
  boardState: boardArray,
  winner: 'X',
  winLength: 3
});
```

## Development

### Testing

Run all tests:

```bash
npm test
```

Run only database tests:

```bash
npm run test:backend
```

### Database Studio

Inspect your database with Drizzle Studio:

```bash
npm run db:studio
```

## Important Notes

1. The package automatically handles database connection management
2. Migrations are packaged with the library and can be run via `runDbMigrations()`
3. SQLite database uses WAL (Write-Ahead Logging) mode for better performance
4. The database connection is automatically closed when the process exits
5. For temporary databases, file cleanup relies on OS temp directory management

## Troubleshooting

If you encounter issues with migrations:

1. Ensure `drizzle/migrations` exists in your project
2. Check that migration SQL files are generated correctly
3. Verify database path permissions
4. For debugging, set NODE_ENV=development for more verbose logging