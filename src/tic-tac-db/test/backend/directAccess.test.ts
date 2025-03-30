import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert';
import { Board, PlayerMarker } from 'tic-tac-types';
import { insertWinStateDirect, getAllWinStatesDirect } from '../../src/backend/db/directAccess';
import { db, schema } from '../../src/backend/db/connection';
import type { NewWinState } from '../../src/backend/db/schema';
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
        throw new Error("Test database path could not be determined.");
    }
    console.log(`[directAccess.test] Using test database: ${testDbPath}`);
    console.log(`[directAccess.test] Expecting migrations folder at: ${migrationsFolder}`);

    try {
        console.log("[directAccess.test] Applying migrations...");
        if (!fs.existsSync(migrationsFolder)) {
             throw new Error(`Migrations directory not found: ${migrationsFolder}.`);
        }
        const migrationFiles = fs.readdirSync(migrationsFolder).filter(file => file.endsWith('.sql'));
        if (migrationFiles.length === 0) {
             console.warn(`[directAccess.test] No SQL migration files found.`);
        } else {
             migrate(db, { migrationsFolder });
             console.log("[directAccess.test] Migrations applied.");
        }
    } catch (error) {
        console.error("[directAccess.test] Error applying migrations:", error);
        throw new Error(`Failed to apply migrations: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
        console.log("[directAccess.test] Clearing 'win_states' table...");
        await db.delete(schema.win_states);
        console.log("[directAccess.test] Cleared 'win_states' table.");
    } catch (e) {
         console.error("[directAccess.test] Error clearing table:", e);
         throw e;
    }
});

after(async () => {
    console.log(`[directAccess.test] Test suite finished. DB connection managed globally.`);
});

describe('Database Direct Access Operations (directAccess.ts)', async () => {

    test('insertWinStateDirect: should directly insert a new win state', async () => {
        const board: Board = [['X', null, 'X'], [null, 'X', null], ['O', 'O', 'X']];
        const hash = 'direct-insert-hash-1';
        const winner: PlayerMarker = 'X';
        const winLength = 3;

        const winStateData: NewWinState = {
            boardHash: hash, boardState: board, winner: winner, winLength: winLength
        };
         await db.delete(schema.win_states);
        const result = await insertWinStateDirect(winStateData);

        assert.ok(result, 'Result should not be null');
        assert.ok(result?.createdAt, 'CreatedAt should be set');

        const retrieved = await db.query.win_states.findFirst({ where: eq(schema.win_states.boardHash, hash) });
        assert.deepStrictEqual(retrieved, result, "Retrieved record should match inserted");
    });

    test('insertWinStateDirect: should throw error when directly inserting duplicate hash', async () => {
        const board: Board = [['O', null, 'O'], [null, 'O', null], ['X', 'X', 'O']];
        const hash = 'direct-insert-duplicate-hash';
        const winner: PlayerMarker = 'O';
        const winLength = 3;

         const winStateData: NewWinState = {
            boardHash: hash, boardState: board, winner: winner, winLength: winLength
        };

        await db.delete(schema.win_states);

        const firstResult = await insertWinStateDirect(winStateData);
        assert.ok(firstResult, "First insertion should succeed");

        await assert.rejects(
            async () => { await insertWinStateDirect(winStateData); },
            (err: Error) => {
                assert.ok(
                    err.message.includes('UNIQUE constraint failed') || err.message.includes('SQLITE_CONSTRAINT_UNIQUE'),
                    `Expected a UNIQUE constraint error, but got: ${err.message}`
                );
                return true;
            },
            'Should throw UNIQUE constraint error'
        );

         const countResult = await db.select({ id: schema.win_states.id }).from(schema.win_states).where(eq(schema.win_states.boardHash, hash));
         assert.strictEqual(countResult.length, 1, 'Should only find one entry');
    });

     test('getAllWinStatesDirect: should retrieve all win states in correct order', async () => {
        const hash1 = 'direct-getall-1';
        const hash2 = 'direct-getall-2';
        const hash3 = 'direct-getall-3';

        await db.delete(schema.win_states);
        const data1: NewWinState = { boardHash: hash1, boardState: [['X',null,null],[null,'X',null],[null,null,'X']], winner: 'X', winLength: 3 };
        const data2: NewWinState = { boardHash: hash2, boardState: [['O',null,null],[null,'O',null],[null,null,'O']], winner: 'O', winLength: 3 };
        const data3: NewWinState = { boardHash: hash3, boardState: [['X','O','X'],['O','X','O'],['X','O','X']], winner: 'X', winLength: 3 };

        await insertWinStateDirect(data1);
        await new Promise(resolve => setTimeout(resolve, 50));
        await insertWinStateDirect(data2);
        await new Promise(resolve => setTimeout(resolve, 50));
        await insertWinStateDirect(data3);

        const allStates = await getAllWinStatesDirect();

        assert.ok(Array.isArray(allStates), 'Should return an array');
        assert.strictEqual(allStates.length, 3, 'Should retrieve exactly 3 records');

        const retrievedHashes = allStates.map(s => s.boardHash);
        assert.ok(retrievedHashes.includes(hash1), `Should include hash ${hash1}`);
        assert.ok(retrievedHashes.includes(hash2), `Should include hash ${hash2}`);
        assert.ok(retrievedHashes.includes(hash3), `Should include hash ${hash3}`);

        assert.strictEqual(allStates[0].boardHash, hash3, 'Results should be sorted by createdAt descending (1st)');
        assert.strictEqual(allStates[1].boardHash, hash2, 'Results should be sorted by createdAt descending (2nd)');
        assert.strictEqual(allStates[2].boardHash, hash1, 'Results should be sorted by createdAt descending (3rd)');
    });

     test('getAllWinStatesDirect: should return empty array when no states exist', async () => {
        await db.delete(schema.win_states);

        const allStates = await getAllWinStatesDirect();

        assert.ok(Array.isArray(allStates), 'Should return an array');
        assert.strictEqual(allStates.length, 0, 'Should return an empty array when no records exist');
     });

});
