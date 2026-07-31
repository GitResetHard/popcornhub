import { randomBytes } from 'node:crypto';

/**
 * Test environment defaults. A developer can override any of these by exporting the variable;
 * CI supplies DATABASE_URL for the disposable test database. Vitest sets NODE_ENV to "test".
 */
process.env.APP_NAME ??= 'Moviestrackr';
process.env.APP_URL ??= 'http://localhost:3000';
process.env.AUTH_SECRET ??= randomBytes(48).toString('base64');
process.env.DATABASE_URL ??= 'postgres://moviestrackr:secret@127.0.0.1:5432/moviestrackr_next_test';
delete process.env.REDIS_URL;

/**
 * The suite truncates tables, so refuse to run unless the target database is clearly a test
 * one. Without this, inheriting a development DATABASE_URL from the shell wipes real data.
 */
const databaseName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '');

if (!/(^|[_-])test$/.test(databaseName)) {
    throw new Error(
        `Refusing to run tests against "${databaseName}": the database name must end in "test". ` +
            'Set DATABASE_URL to a dedicated test database.',
    );
}
