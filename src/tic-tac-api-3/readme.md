# Tic Tac API 3

A RESTful API for Tic Tac Toe game built with NestJS. This API provides endpoints to evaluate game states, make moves, and retrieve game history.

## Key Features

- Evaluate game boards to determine winners
- Make moves on a board with optional AI opponent
- Support for dynamic board sizes (3x3, 4x4, 5x5, etc.)
- Configurable win length (default: 3 in a row)
- Game history storage and retrieval
- Multiple AI difficulty levels (easy, medium, hard)
- DeepSeek AI integration for advanced move calculation

## Configuration

The application can be configured using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TIC_TAC_PORT` | The port number for the API server | `10101` |
| `TIC_TAC_DB_PATH` | Custom path for the database file | Auto-generated |
| `DEEPSEEK_API_KEY` | API key for DeepSeek AI service (used for AI opponent) | Fallback to SimpleAI |
| `DEEPSEEK_MODEL` | Model name for DeepSeek AI service | `deepseek-coder` |
| `PRODUCTION` | Set to `true` to skip automatic migrations | `false` |

> **Note**: If `DEEPSEEK_API_KEY` is not provided or set to "fallback", the system will automatically use the built-in SimpleAI implementation instead of making external API calls.

## API Endpoints

### Evaluate Game Board

```
POST /games/evaluate
```

Evaluates a game board to determine if there's a winner.

Request body:
```json
{
  "board": [
    ["X", "X", "X"],
    ["O", "O", null],
    [null, null, null]
  ],
  "winLength": 3
}
```

### Make a Move

```
POST /games/move
```

Makes a move on the board and optionally gets an AI response.

Request body:
```json
{
  "board": [
    ["X", null, null],
    [null, null, null],
    [null, null, null]
  ],
  "x": 1,
  "y": 0,
  "winLength": 3,
  "withAI": true,
  "difficulty": "medium"
}
```

Response:
```json
{
  "board": [
    ["X", "O", null],
    [null, null, null],
    [null, null, null]
  ],
  "winner": null,
  "gameOver": false,
  "nextPlayer": "X",
  "aiMove": {
    "x": 1,
    "y": 0
  }
}
```

The `difficulty` parameter can be set to:
- `easy` - AI may make suboptimal moves
- `medium` - AI plays with moderate skill (default)
- `hard` - AI plays optimally and strategically

### Get Game History

```
GET /games
```

Retrieves the history of completed games with winners.

## Testing the API

The repository includes several shell scripts to help test the API:

- `scripts/send-board.sh` - Send different board configurations
- `scripts/test-winning-board.sh` - Test a specific winning board
- `scripts/test-ai-move.sh` - Interactive testing of the AI opponent

Example usage:
```bash
# Test a winning board
./scripts/test-winning-board.sh

# Test the AI opponent
./scripts/test-ai-move.sh
```

## Development

The application is built with NestJS and uses a modular architecture with the following components:

- `games.controller.ts` - API endpoints and request handling
- `games.service.ts` - Business logic for game evaluation and moves
- `game-manager.ts` - Manages game state and AI opponent integration

### AI Integration

The system uses the `tic-tac-toe-ai-clients` package which provides:

- **AI Client Factory** - Creates appropriate AI clients based on configuration
- **SimpleAIClient** - Fallback implementation with basic strategy (win, block, center, corner, random)
- **DeepSeekAdapter** - Advanced AI using DeepSeek's LLM API
- **Configurable Difficulty Levels** - easy, medium, and hard strategies
- **Prompt Providers** - Formats board states and strategic guidance for LLM-based decision making

Dependencies:
- `tic-tac-winner` - Logic for checking winners
- `tic-tac-board-hash` - Hashing board states
- `tic-tac-db` - Database operations
- `tic-tac-valid` - Validation utilities
- `tic-tac-toe-ai-clients` - AI opponent integration with fallback strategies

## License

This project is licensed under the MIT License.