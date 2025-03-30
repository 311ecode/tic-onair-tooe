import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import crypto from 'node:crypto';

const getDatabasePath = (): string => {
  const dbPathFromEnv = process.env.DATABASE_PATH;
  if (dbPathFromEnv) {
    const dir = path.dirname(dbPathFromEnv);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    console.log(`[drizzle-kit] Using database path from env: ${dbPathFromEnv}`);
    return dbPathFromEnv;
  } else {
    const tmpDir = os.tmpdir();
    const defaultTempName = 'tic-tac-toe-default.sqlite';
    let tempPath = path.join(tmpDir, defaultTempName);

    if (!fs.existsSync(tempPath) && !process.env.DATABASE_PATH_GENERATED) {
        const uniqueName = `tic-tac-toe-${crypto.randomUUID()}.sqlite`;
        tempPath = path.join(tmpDir, uniqueName);
        process.env.DATABASE_PATH_GENERATED = tempPath;
        console.log(`[drizzle-kit] No DATABASE_PATH set. Using NEW temporary database: ${tempPath}`);
    } else if (process.env.DATABASE_PATH_GENERATED) {
        tempPath = process.env.DATABASE_PATH_GENERATED;
        console.log(`[drizzle-kit] Reusing generated temporary database: ${tempPath}`);
    } else {
         console.log(`[drizzle-kit] No DATABASE_PATH set. Using default temporary database: ${tempPath}`);
    }
     if (!process.env.DATABASE_PATH) {
        process.env.RUNTIME_DATABASE_PATH = tempPath;
     }
    return tempPath;
  }
};

const dbPath = getDatabasePath();

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/backend/db/schema.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    url: dbPath,
  },
  verbose: true,
  strict: true,
});
