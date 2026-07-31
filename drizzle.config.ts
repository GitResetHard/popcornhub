import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/db/schema/index.ts',
    out: './drizzle',
    dialect: 'mysql',
    dbCredentials: {
        url: process.env.DATABASE_URL ?? 'mysql://moviestrackr:secret@127.0.0.1:3306/moviestrackr_next',
    },
    verbose: true,
    strict: true,
});
