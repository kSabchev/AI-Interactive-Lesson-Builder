import "server-only";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * The query API shared by both drivers (and by transactions). PGlite's client is cast to it once below;
 * the two drivers expose the same query builder at runtime.
 */
export type Database = PgDatabase<NodePgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

/**
 * With DATABASE_URL set (production, staging), connects to that Postgres; run `npm run db:migrate` to
 * apply migrations there. Without it, uses an embedded PGlite database (`PGLITE_DIR`, default
 * `.data/pglite`; `memory://` for tests) and migrates it automatically, so local development needs no setup.
 */
async function connect(): Promise<Database> {
  if (process.env.DATABASE_URL) {
    return drizzlePg(new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }), { schema });
  }
  const client = new PGlite(process.env.PGLITE_DIR || path.join(process.cwd(), ".data", "pglite"));
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder: MIGRATIONS });
  return db as unknown as Database;
}

// Survives dev-server hot reloads, so one embedded database is opened per process.
const globalForDb = globalThis as unknown as { lessonBuilderDb?: Promise<Database> };

export function getDb(): Promise<Database> {
  globalForDb.lessonBuilderDb ??= connect().catch((error) => {
    globalForDb.lessonBuilderDb = undefined;
    throw error;
  });
  return globalForDb.lessonBuilderDb;
}

export { schema };
