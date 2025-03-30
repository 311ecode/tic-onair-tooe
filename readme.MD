## Development and Deployment

### Building and Running

The project uses a Lerna-based monorepo with NPM workspaces for managing dependencies across multiple packages. Husky is configured for git hooks.

```bash
# Install dependencies and build all packages
npm run build

# Run all tests (also installs dependencies and builds packages)
npm test
```

**Note about the build system:**
- `npm test` automatically handles installation, building, and running all tests
- Lerna intelligently resolves dependencies between packages, including recursive dependencies
- The build adn test processes include caching to optimize performance
- Husky ensures code quality by running checks during git operations

To start the server after building:

```bash
# Navigate to the API package
cd src/tic-tac-api-3

# Start the server
node dist/main.js
```

### Environment Variables

| Variable | Description | Default | Used In |
|----------|-------------|---------|---------|
| `TIC_TAC_PORT` | The port number for the API server | `10101` | tic-tac-api-3 |
| `TIC_TAC_DB_PATH` | Custom path for the database file | Auto-generated | tic-tac-db |
| `DATABASE_PATH` | Alternative way to set DB path | Auto-generated | tic-tac-db |
| `DEEPSEEK_API_KEY` | API key for DeepSeek AI service | Fallback to SimpleAI | tic-tac-toe-ai-clients |
| `DEEPSEEK_MODEL` | Model name for DeepSeek AI service | `deepseek-coder` | tic-tac-toe-ai-clients |
| `PRODUCTION` | Set to `true` to skip automatic migrations | `false` | tic-tac-api-3 |
| `AI_API_KEY` | Alternative name for DeepSeek API key | N/A | tic-tac-one-turn-chatbot |

### Packages in the Monorepo

The project contains the following packages:

1. **tic-tac-api-3**: Main NestJS API server
2. **tic-tac-db**: Database module for SQLite with Drizzle ORM
3. **tic-tac-types**: Shared TypeScript type definitions
4. **tic-tac-valid**: Validation utilities for game states and moves
5. **tic-tac-winner**: Win condition detection logic
6. **tic-tac-board-hash**: Board state hashing utilities
7. **tic-tac-toe-ai-clients**: AI opponent implementations
8. **tic-tac-one-turn-chatbot**: Command-line interface for playing against AI

Each package can be built and tested individually using Lerna commands:

```bash
# Build a specific package
npx lerna run build --scope=tic-tac-api-3

# Test a specific package
npx lerna run test --scope=tic-tac-valid
```

Or just go to the package directory and run:

```bash
# Navigate to the package directory
npm run build
npm test
```
