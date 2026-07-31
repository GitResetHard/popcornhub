import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/db/schema/index.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        // Prefer a direct (unpooled) connection for DDL/migrations when the host provides one
        // (Neon sets DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING); fall back to the pooled
        // DATABASE_URL, then to the local development database.
        url:
            process.env.DATABASE_URL_UNPOOLED ??
            process.env.POSTGRES_URL_NON_POOLING ??
            process.env.DATABASE_URL ??
            'postgres://moviestrackr:secret@127.0.0.1:5432/moviestrackr_next',
    },
    verbose: true,
    strict: true,
});
