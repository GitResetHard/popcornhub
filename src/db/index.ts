import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '@/lib/env';
import * as schema from './schema';

/** A single pool is reused across hot reloads so module refreshes do not exhaust connections. */
const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

function createPool(): mysql.Pool {
    return mysql.createPool({
        uri: env.DATABASE_URL,
        connectionLimit: env.DATABASE_POOL_SIZE,
        timezone: 'Z',
        decimalNumbers: true,
        supportBigNumbers: true,
        bigNumberStrings: false,
        enableKeepAlive: true,
    });
}

export const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
    globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema, mode: 'default' });

export type Database = typeof db;

export { schema };
