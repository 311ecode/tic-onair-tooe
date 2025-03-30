import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './connection';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsFolder = path.resolve(__dirname, '../../../drizzle/migrations');

console.log(`Running migrations from: ${migrationsFolder}`);

try {
  migrate(db, { migrationsFolder });
  console.log("Migrations applied successfully.");
} catch (error) {
  console.error("Error applying migrations:", error);
  process.exit(1);
}

process.exit(0);
