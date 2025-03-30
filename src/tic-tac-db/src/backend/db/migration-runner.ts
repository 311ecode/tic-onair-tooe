import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './connection';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

function findPackageRoot(startDir: string): string {
    let currentDir = path.resolve(startDir);
    while (true) {
        const packageJsonPath = path.join(currentDir, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
                const packageJson = JSON.parse(packageJsonContent);
                if (packageJson.name === 'tic-tac-db') {
                    return currentDir;
                }
            } catch (e) {
                console.warn(`[Migration Lib] Warning: Error reading/parsing ${packageJsonPath}`, e);
            }
        }

        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            throw new Error("[Migration Lib] Could not find package root for 'tic-tac-db' by traversing up the directory tree.");
        }
        currentDir = parentDir;
    }
}

export function runDbMigrations() {
    let currentModuleDir: string;

    const isCJS = typeof require === 'function' && typeof __dirname !== 'undefined';

    if (isCJS) {
        console.log("[Migration Lib] Detected CJS context.");
        currentModuleDir = __dirname;
    } else if (typeof import.meta?.url === 'string') {
        console.log("[Migration Lib] Detected ESM context.");
        currentModuleDir = path.dirname(fileURLToPath(import.meta.url));
    } else {
        console.error("[Migration Lib] FATAL: Could not determine module context (ESM/CJS) or file location.");
        throw new Error("Failed to determine execution context for migration runner.");
    }

    console.log(`[Migration Lib] Initial directory for search: ${currentModuleDir}`);

    let packageRootDir: string;
    try {
         packageRootDir = findPackageRoot(currentModuleDir);
         console.log(`[Migration Lib] Determined package root: ${packageRootDir}`);
    } catch (error) {
         console.error(`[Migration Lib] Failed to find package root: ${error.message}`);
         throw error;
    }

    const migrationsFolder = path.resolve(packageRootDir, 'drizzle', 'migrations');

    console.log(`[Migration Lib] Attempting to run migrations from: ${migrationsFolder}`);

    if (!fs.existsSync(migrationsFolder)) {
        const errorMsg = `[Migration Lib] Migrations directory not found at calculated path: ${migrationsFolder}. Verify 'drizzle/migrations' exists relative to package root.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    const migrationFiles = fs.readdirSync(migrationsFolder).filter(
        (file) => file.endsWith('.sql') || file.endsWith('.mjs')
    );

    if (migrationFiles.length === 0) {
        console.warn(`[Migration Lib] No migration files found in ${migrationsFolder}. Assuming schema is up-to-date or managed manually.`);
        return;
    }

    try {
        migrate(db, { migrationsFolder });
        console.log("[Migration Lib] Migrations applied successfully.");
    } catch (error) {
        console.error("[Migration Lib] Error applying migrations:", error);
        throw error;
    }
}

