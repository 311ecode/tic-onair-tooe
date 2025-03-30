import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert';
import { Board, PlayerMarker } from 'tic-tac-types';
import { storeGameResult, getAllCompletedGames, getGameResultByHash } from '../../src/backend/db/queries';
import { db, schema } from '../../src/backend/db/connection';
import { eq } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';

let testDbPath: string | undefined;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, '../../drizzle/migrations');

before(async () => {
    testDbPath = process.env.RUNTIME_DATABASE_PATH || process.env.DATABASE_PATH;
    if (!testDbPath) {
        throw new Error("Test database path could not be determined. Ensure connection logic runs or DATABASE_PATH is set.");
    }
    console.log(`[queries.test] Using test database: ${testDbPath}`);
    console.log(`[queries.test] Expecting migrations folder at: ${migrationsFolder}`);

    try {
        console.log("[queries.test] Applying migrations for test database...");
        if (!fs.existsSync(migrationsFolder)) {
             throw new Error(`Migrations directory not found: ${migrationsFolder}. Run 'npm run db:generate' first.`);
        }
        const migrationFiles = fs.readdirSync(migrationsFolder).filter(file => file.endsWith('.sql'));
        if (migrationFiles.length === 0) {
             console.warn(`[queries.test] No SQL migration files found in ${migrationsFolder}. Assuming schema is up-to-date or managed manually.`);
        } else {
             migrate(db, { migrationsFolder });
             console.log("[queries.test] Migrations applied successfully.");
        }
    } catch (error) {
        console.error("[queries.test] Error applying migrations:", error);
        throw new Error(`Failed to apply migrations: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
        console.log("[queries.test] Clearing 'win_states' table for testing...");
        await db.delete(schema.win_states);
        console.log("[queries.test] Cleared 'win_states' table successfully.");
    } catch (e) {
         console.error("[queries.test] Error clearing 'win_states' table:", e);
         throw e;
    }
});

after(async () => {
    console.log(`[queries.test] Test suite finished. DB connection managed globally.`);
});


describe('Database Query Operations (queries.ts)', async () => {

    test('storeGameResult: should store a new win state result', async () => {
        const board: Board = [['X', 'X', 'X'], ['O', 'O', null], [null, null, null]];
        const hash = 'queries-test-hash-1';
        const winner: PlayerMarker = 'X';
        const winLength = 3;

        await db.delete(schema.win_states);
        const result = await storeGameResult(hash, board, winner, winLength);

        assert.ok(result, 'Result should not be null after storing');
        assert.strictEqual(result?.boardHash, hash, 'Board hash should match');
        assert.ok(result?.createdAt, 'CreatedAt should be set');
    });

    test('storeGameResult: should not store a duplicate win state result (by hash)', async () => {
        const board: Board = [['O', 'O', 'O'], ['X', 'X', null], [null, null, null]];
        const hash = 'queries-test-hash-2-duplicate';
        const winner: PlayerMarker = 'O';
        const winLength = 3;

        await db.delete(schema.win_states);

        const firstResult = await storeGameResult(hash, board, winner, winLength);
        assert.ok(firstResult, 'First insertion should succeed');

        const secondResult = await storeGameResult(hash, board, winner, winLength);
        assert.ok(secondResult, 'Second call should return the existing record');
        assert.strictEqual(secondResult?.id, firstResult?.id, 'IDs should match for existing record');
        const countResult = await db.select({ id: schema.win_states.id }).from(schema.win_states).where(eq(schema.win_states.boardHash, hash));
        assert.strictEqual(countResult.length, 1, 'Should only find one entry in the database');
    });

    test('getAllCompletedGames: should retrieve all completed game win states in correct order', async () => {
        const hash1 = 'queries-test-getall-1';
        const hash2 = 'queries-test-getall-2';
        const winLength1 = 3;
        const winLength2 = 4;

        await db.delete(schema.win_states);

        await storeGameResult(hash1, [['X', 'X', 'X'], ['O', 'O', null], [null, null, null]], 'X', winLength1);
        await new Promise(resolve => setTimeout(resolve, 50));
        await storeGameResult(hash2, [['O', 'O', 'O', 'O'], ['X', 'X', null, null], [null, null, null, null], [null, null, null, null]], 'O', winLength2);


        const allWinStates = await getAllCompletedGames();
        assert.ok(Array.isArray(allWinStates), 'Should return an array');
        assert.strictEqual(allWinStates.length, 2, `Should have exactly 2 states, found ${allWinStates.length}`);

        const state1 = allWinStates.find(g => g.boardHash === hash1);
        const state2 = allWinStates.find(g => g.boardHash === hash2);
        assert.ok(state1, `Win state with hash ${hash1} should exist`);
        assert.ok(state2, `Win state with hash ${hash2} should exist`);
        assert.strictEqual(state1?.winLength, winLength1, 'Win state 1 should have correct winLength');
        assert.strictEqual(state2?.winLength, winLength2, 'Win state 2 should have correct winLength');

        assert.strictEqual(allWinStates[0].boardHash, hash2, 'Results should be sorted by createdAt descending (1st)');
        assert.strictEqual(allWinStates[1].boardHash, hash1, 'Results should be sorted by createdAt descending (2nd)');
    });

     test('getGameResultByHash: should retrieve a specific win state by hash', async () => {
        const hash = 'queries-test-getone-1';
        const winLength = 3;
        const board: Board = [['X', 'X', 'X'], ['O', 'O', null], [null, null, null]];

        await db.delete(schema.win_states);
        await storeGameResult(hash, board, 'X', winLength);

        const winState = await getGameResultByHash(hash);

        assert.ok(winState, 'Win state should be found by hash');
        assert.deepStrictEqual(winState?.boardState, board, 'Board state should match');
    });

    test('getGameResultByHash: should return null when retrieving a non-existent win state by hash', async () => {
        const hash = 'queries-non-existent-hash';
        await db.delete(schema.win_states).where(eq(schema.win_states.boardHash, hash));

        const winState = await getGameResultByHash(hash);
        assert.strictEqual(winState, null, 'Should return null for a non-existent hash');
    });

     test('storeGameResult: should handle database errors gracefully during store (simulated)', async (t) => {
        const originalFindFirst = db.query.win_states.findFirst;
        const originalInsert = db.insert;
        db.query.win_states.findFirst = t.mock.fn(async () => undefined);
        db.insert = t.mock.fn(() => { throw new Error('Forced DB Error during insert') });

        const board: Board = [['X', null, null], [null, 'X', null], [null, null, 'X']];
        const hash = 'queries-error-test-hash';
        const winner: PlayerMarker = 'X';
        const winLength = 3;
        const errorMock = mock.method(console, 'error', () => {});

        const result = await storeGameResult(hash, board, winner, winLength);
        assert.strictEqual(result, null, 'Should return null on database error during insert');

        db.query.win_states.findFirst = originalFindFirst;
        db.insert = originalInsert;
        errorMock.mock.restore();

        const game = await getGameResultByHash(hash);
        assert.strictEqual(game, null, 'Win state should not exist in DB after simulated error');
    });
});
