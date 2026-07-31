import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/db/schema/index.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL ?? 'postgres://moviestrackr:secret@127.0.0.1:5432/moviestrackr_next',
    },
    verbose: true,
    strict: true,
});
