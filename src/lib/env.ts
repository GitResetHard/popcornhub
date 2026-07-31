import { z } from 'zod';

const serverSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    APP_NAME: z.string().default('Moviestrackr'),
    APP_URL: z.string().url().default('http://localhost:3000'),
    /** Secret used to sign session and OAuth-state cookies. */
    AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters'),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DATABASE_POOL_SIZE: z.coerce.number().int().positive().default(10),

    REDIS_URL: z.string().optional(),

    TMDB_API_TOKEN: z.string().optional(),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URL: z.string().optional(),

    SESSION_LIFETIME_DAYS: z.coerce.number().int().positive().default(30),
    SESSION_COOKIE_NAME: z.string().default('moviestrackr_session'),

    UPLOADS_URL: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;

function loadEnv(): ServerEnv {
    const parsed = serverSchema.safeParse(process.env);

    if (!parsed.success) {
        const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');

        throw new Error(`Invalid environment configuration:\n${issues}`);
    }

    return parsed.data;
}

let cached: ServerEnv | undefined;

/**
 * Validation is deferred until first access so importing this module during a build (where
 * secrets may be absent) does not fail.
 */
export const env = new Proxy({} as ServerEnv, {
    get(_target, prop: string) {
        cached ??= loadEnv();

        return cached[prop as keyof ServerEnv];
    },
});

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export function posterUrl(path: string | null | undefined, size: 'w185' | 'w342' | 'w500' | 'original' = 'w500'): string | null {
    return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
}

export function backdropUrl(path: string | null | undefined, size: 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
}
