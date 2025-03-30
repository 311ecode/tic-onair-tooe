import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import crypto from 'node:crypto';
import 'dotenv/config';

import * as schema from './schema';

const getDatabasePath = (): string => {
  const dbPathFromEnv = process.env.DATABASE_PATH;
  if (dbPathFromEnv) {
    const dir = path.dirname(dbPathFromEnv);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dbPathFromEnv;
  } else {
    const tmpDir = os.tmpdir();
    const defaultTempName = 'tic-tac-toe-default.sqlite';
    let tempPath = path.join(tmpDir, defaultTempName);

    if (!fs.existsSync(tempPath) && !process.env.DATABASE_PATH_GENERATED) {
        const uniqueName = `tic-tac-toe-${crypto.randomUUID()}.sqlite`;
        tempPath = path.join(tmpDir, uniqueName);
        process.env.DATABASE_PATH_GENERATED = tempPath;
        console.log(`[DB Connection] No DATABASE_PATH set. Using NEW temporary database: ${tempPath}`);
    } else if (process.env.DATABASE_PATH_GENERATED) {
        tempPath = process.env.DATABASE_PATH_GENERATED;
    } else {
    }

    if (!process.env.DATABASE_PATH) {
      process.env.RUNTIME_DATABASE_PATH = tempPath;
    }
    return tempPath;
  }
};


const databasePath = getDatabasePath();
const sqlite = new Database(databasePath);
console.log(`[DB Connection] Connected to SQLite database at: ${databasePath}`);

sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema, logger: false });

process.on('exit', () => {
    console.log('[DB Connection] Closing SQLite database connection.');
    sqlite.close();
});
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());

export { schema };
