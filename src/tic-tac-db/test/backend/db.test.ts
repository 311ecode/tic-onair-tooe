import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert';
import { Board, PlayerMarker } from 'tic-tac-types';
import { storeGameResult, getAllCompletedGames, getGameResultByHash } from '../../src/backend/db/queries';
import { insertWinStateDirect, getAllWinStatesDirect } from '../../src/backend/db/directAccess';
import { db, schema } from '../../src/backend/db/connection';
import { eq } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';
import type { NewWinState } from '../../src/backend/db/schema';

let testDbPath: string | undefined;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, '../../drizzle/migrations');

describe('Database Operations for Win States', async () => {

    before(async () => {
        testDbPath = process.env.RUNTIME_DATABASE_PATH || process.env.DATABASE_PATH;
        if (!testDbPath) {
            throw new Error("Test database path could not be determined. Ensure connection logic runs or DATABASE_PATH is set.");
        }
        console.log(`Using test database: ${testDbPath}`);
        console.log(`Expecting migrations folder at: ${migrationsFolder}`);

        try {
            console.log("Applying migrations for test database...");
            if (!fs.existsSync(migrationsFolder)) {
                 throw new Error(`Migrations directory not found: ${migrationsFolder}. Run 'npm run db:generate' first.`);
            }
            const migrationFiles = fs.readdirSync(migrationsFolder).filter(file => file.endsWith('.sql'));
            if (migrationFiles.length === 0) {
                 console.warn(`No SQL migration files found in ${migrationsFolder}. Assuming schema is up-to-date or managed manually.`);
            } else {
                 migrate(db, { migrationsFolder });
                 console.log("Migrations applied successfully.");
            }
        } catch (error) {
            console.error("Error applying migrations:", error);
            throw new Error(`Failed to apply migrations: ${error instanceof Error ? error.message : String(error)}`);
        }

        try {
            console.log("Clearing 'win_states' table for testing...");
            await db.delete(schema.win_states);
            console.log("Cleared 'win_states' table successfully.");
        } catch (e) {
             console.error("Error clearing 'win_states' table:", e);
             throw e;
        }
    });

    after(async () => {
        if (testDbPath && testDbPath.includes('tic-tac-toe-') && testDbPath.includes('.sqlite')) {
            const dbDir = path.dirname(testDbPath);
            const osTmpDir = os.tmpdir();
            if (dbDir === osTmpDir) {
                try {
                    console.log(`NOTE: Temporary test database deletion skipped due to potential file locks. Relying on OS cleanup or manual removal of: ${testDbPath}`);
                } catch (err) {
                    console.error(`Failed to remove temporary test database ${testDbPath}:`, err);
                }
            } else {
                 console.log(`Skipping removal of database outside temp directory: ${testDbPath}`);
            }
        } else {
             console.log(`Skipping removal of non-temporary or non-matching database: ${testDbPath}`);
        }
    });

    test('storeGameResult: should store a new win state result', async () => {
        const board: Board = [['X', 'X', 'X'], ['O', 'O', null], [null, null, null]];
        const hash = 'test-hash-original-1';
        const winner: PlayerMarker = 'X';
        const winLength = 3;

        const result = await storeGameResult(hash, board, winner, winLength);

        assert.ok(result, 'Result should not be null after storing');
        assert.strictEqual(result?.boardHash, hash, 'Board hash should match');
        assert.deepStrictEqual(result?.boardState, board, 'Board state should match');
        assert.strictEqual(result?.winner, winner, 'Winner should match');
        assert.strictEqual(result?.winLength, winLength, 'WinLength should match');
        assert.ok(result?.createdAt, 'CreatedAt should be set');
    });

    test('storeGameResult: should not store a duplicate win state result (by hash)', async () => {
        const board: Board = [['O', 'O', 'O'], ['X', 'X', null], [null, null, null]];
        const hash = 'test-hash-original-2-duplicate';
        const winner: PlayerMarker = 'O';
        const winLength = 3;

        const firstResult = await storeGameResult(hash, board, winner, winLength);
        assert.ok(firstResult, 'First insertion should succeed');

        const secondResult = await storeGameResult(hash, board, winner, winLength);
        assert.ok(secondResult, 'Second call should return the existing record');
        assert.strictEqual(secondResult?.id, firstResult?.id, 'IDs should match for existing record');
        assert.strictEqual(secondResult?.winLength, winLength, 'WinLength should match on existing record');

        const countResult = await db.select({ id: schema.win_states.id }).from(schema.win_states).where(eq(schema.win_states.boardHash, hash));
        assert.strictEqual(countResult.length, 1, 'Should only find one entry in the database');
    });

    test('getAllCompletedGames: should retrieve all completed game win states', async () => {
        const hash1 = 'test-hash-original-getall-1';
        const hash2 = 'test-hash-original-getall-2';
        const winLength1 = 3;
        const winLength2 = 4;

        await db.delete(schema.win_states);

        await storeGameResult(hash1, [['X', 'X', 'X'], ['O', 'O', null], [null, null, null]], 'X', winLength1);
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
         assert.strictEqual(allWinStates[0].boardHash, hash2, 'Results should be sorted by createdAt descending');
    });

     test('getGameResultByHash: should retrieve a specific win state by hash', async () => {
        const hash = 'test-hash-original-getone-1';
        const winLength = 3;
        const board: Board = [['X', 'X', 'X'], ['O', 'O', null], [null, null, null]];

        await db.delete(schema.win_states);
        await storeGameResult(hash, board, 'X', winLength);

        const winState = await getGameResultByHash(hash);

        assert.ok(winState, 'Win state should be found by hash');
        assert.strictEqual(winState?.boardHash, hash, 'Board hash should match');
        assert.strictEqual(winState?.winner, 'X', 'Winner should be X');
        assert.strictEqual(winState?.winLength, winLength, 'Retrieved winLength should match');
        assert.deepStrictEqual(winState?.boardState, board, 'Board state should match');
    });

    test('getGameResultByHash: should return null when retrieving a non-existent win state by hash', async () => {
        const hash = 'non-existent-hash';
        const winState = await getGameResultByHash(hash);
        assert.strictEqual(winState, null, 'Should return null for a non-existent hash');
    });

     test('storeGameResult: should handle database errors gracefully during store (simulated)', async (t) => {
        const originalFindFirst = db.query.win_states.findFirst;
        const originalInsert = db.insert;

        db.query.win_states.findFirst = t.mock.fn(async () => undefined);
        db.insert = t.mock.fn(() => { throw new Error('Forced DB Error during insert') });

        const board: Board = [['X', null, null], [null, 'X', null], [null, null, 'X']];
        const hash = 'error-test-hash';
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


    test('insertWinStateDirect: should directly insert a new win state', async () => {
        const board: Board = [['X', null, 'X'], [null, 'X', null], ['O', 'O', 'X']];
        const hash = 'direct-insert-hash-1';
        const winner: PlayerMarker = 'X';
        const winLength = 3;

        const winStateData: NewWinState = {
            boardHash: hash,
            boardState: board,
            winner: winner,
            winLength: winLength
        };

        const result = await insertWinStateDirect(winStateData);

        assert.ok(result, 'Result should not be null after direct insertion');
        assert.strictEqual(result?.boardHash, hash, 'Board hash should match');
        assert.deepStrictEqual(result?.boardState, board, 'Board state should match');
        assert.strictEqual(result?.winner, winner, 'Winner should match');
        assert.strictEqual(result?.winLength, winLength, 'WinLength should match');
        assert.ok(result?.id, 'ID should be assigned');
        assert.ok(result?.createdAt, 'CreatedAt should be set');

        const retrieved = await db.query.win_states.findFirst({ where: eq(schema.win_states.boardHash, hash) });
        assert.deepStrictEqual(retrieved, result, "Retrieved record should match inserted record");
    });

    test('insertWinStateDirect: should throw error when directly inserting duplicate hash', async () => {
        const board: Board = [['O', null, 'O'], [null, 'O', null], ['X', 'X', 'O']];
        const hash = 'direct-insert-duplicate-hash';
        const winner: PlayerMarker = 'O';
        const winLength = 3;

         const winStateData: NewWinState = {
            boardHash: hash,
            boardState: board,
            winner: winner,
            winLength: winLength
        };

        await db.delete(schema.win_states);

        const firstResult = await insertWinStateDirect(winStateData);
        assert.ok(firstResult, "First insertion should succeed");

        await assert.rejects(
            async () => {
                await insertWinStateDirect(winStateData);
            },
            (err: Error) => {
                assert.ok(
                    err.message.includes('UNIQUE constraint failed') || err.message.includes('SQLITE_CONSTRAINT_UNIQUE'),
                    `Expected a UNIQUE constraint error, but got: ${err.message}`
                );
                return true;
            },
            'Should throw an error due to UNIQUE constraint on boardHash'
        );

         const countResult = await db.select({ id: schema.win_states.id }).from(schema.win_states).where(eq(schema.win_states.boardHash, hash));
         assert.strictEqual(countResult.length, 1, 'Should only find one entry in the database after failed duplicate insert');
    });

     test('getAllWinStatesDirect: should retrieve all win states using direct getter', async () => {
        const hash1 = 'direct-all-1';
        const hash2 = 'direct-all-2';
        const hash3 = 'direct-all-3';

        await db.delete(schema.win_states);
        const data1: NewWinState = { boardHash: hash1, boardState: [['X',null,null],[null,'X',null],[null,null,'X']], winner: 'X', winLength: 3 };
        const data2: NewWinState = { boardHash: hash2, boardState: [['O',null,null],[null,'O',null],[null,null,'O']], winner: 'O', winLength: 3 };
        await insertWinStateDirect(data1);
        await insertWinStateDirect(data2);
        await new Promise(resolve => setTimeout(resolve, 10));
        const data3: NewWinState = { boardHash: hash3, boardState: [['X','O','X'],['O','X','O'],['X','O','X']], winner: 'X', winLength: 3 };
        await insertWinStateDirect(data3);

        const allStates = await getAllWinStatesDirect();

        assert.ok(Array.isArray(allStates), 'Should return an array');
        assert.strictEqual(allStates.length, 3, 'Should retrieve exactly 3 records');

        const retrievedHashes = allStates.map(s => s.boardHash);
        assert.ok(retrievedHashes.includes(hash1), `Should include hash ${hash1}`);
        assert.ok(retrievedHashes.includes(hash2), `Should include hash ${hash2}`);
        assert.ok(retrievedHashes.includes(hash3), `Should include hash ${hash3}`);

        assert.strictEqual(allStates[0].boardHash, hash3, 'Results should be sorted by createdAt descending');
        assert.strictEqual(allStates[1].boardHash, hash2, 'Results should be sorted by createdAt descending');
        assert.strictEqual(allStates[2].boardHash, hash1, 'Results should be sorted by createdAt descending');
    });

});
