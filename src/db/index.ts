import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/lib/env';
import * as schema from './schema';

/** A single pool is reused across hot reloads so module refreshes do not exhaust connections. */
const globalForDb = globalThis as unknown as { pool?: Pool };

/**
 * node-postgres talks to any PostgreSQL server, including Neon's pooled endpoint on Vercel.
 * SSL for managed providers is enabled through the connection string (e.g. `?sslmode=require`),
 * so nothing extra is configured here.
 */
function createPool(): Pool {
    return new Pool({
        connectionString: env.DATABASE_URL,
        max: env.DATABASE_POOL_SIZE,
    });
}

export const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
    globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;

export { schema };
