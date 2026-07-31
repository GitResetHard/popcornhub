import { createHash } from 'node:crypto';
import Redis from 'ioredis';
import { env } from './env';

/**
 * Cache wrapper. Keys and TTLs mirror the reference implementation's TMDB caching so the app
 * stays comfortably inside TMDB's rate limits. Without REDIS_URL it degrades to an in-process
 * map, which keeps local development and tests working without Redis.
 */

const PREFIX = 'moviestrackr:';

type CacheEntry = { value: string; expiresAt: number };

const globalForCache = globalThis as unknown as {
    redis?: Redis | null;
    memoryCache?: Map<string, CacheEntry>;
};

function createRedis(): Redis | null {
    if (!env.REDIS_URL) {
        return null;
    }

    const client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 2,
        lazyConnect: true,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });

    client.on('error', (error) => {
        console.warn('[cache] redis error:', error.message);
    });

    return client;
}

function redis(): Redis | null {
    if (globalForCache.redis === undefined) {
        globalForCache.redis = createRedis();
    }

    return globalForCache.redis;
}

function memory(): Map<string, CacheEntry> {
    globalForCache.memoryCache ??= new Map();

    return globalForCache.memoryCache;
}

function prefixed(key: string): string {
    return `${PREFIX}${key}`;
}

export const TTL = {
    minutes: (n: number) => n * 60,
    hours: (n: number) => n * 3600,
    days: (n: number) => n * 86400,
} as const;

export async function cacheGet<T>(key: string): Promise<T | undefined> {
    const client = redis();
    const fullKey = prefixed(key);

    if (client) {
        try {
            const raw = await client.get(fullKey);

            return raw === null ? undefined : (JSON.parse(raw) as T);
        } catch {
            return undefined;
        }
    }

    const entry = memory().get(fullKey);

    if (!entry) {
        return undefined;
    }

    if (entry.expiresAt < Date.now()) {
        memory().delete(fullKey);

        return undefined;
    }

    return JSON.parse(entry.value) as T;
}

export async function cachePut(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const client = redis();
    const fullKey = prefixed(key);
    const serialized = JSON.stringify(value);

    if (client) {
        try {
            await client.set(fullKey, serialized, 'EX', ttlSeconds);
        } catch {
            // Losing a cache write is acceptable; the value will be recomputed next time.
        }

        return;
    }

    memory().set(fullKey, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheForget(key: string): Promise<void> {
    const client = redis();
    const fullKey = prefixed(key);

    if (client) {
        try {
            await client.del(fullKey);
        } catch {
            // A stale entry expires on its own.
        }

        return;
    }

    memory().delete(fullKey);
}

export async function remember<T>(key: string, ttlSeconds: number, resolver: () => Promise<T>): Promise<T> {
    const cached = await cacheGet<T>(key);

    if (cached !== undefined) {
        return cached;
    }

    const value = await resolver();

    if (value !== undefined) {
        await cachePut(key, value, ttlSeconds);
    }

    return value;
}

/** Stable hash for cache keys built from filter objects; key ordering is normalised. */
export async function hashFilters(filters: Record<string, unknown>): Promise<string> {
    const sorted = Object.keys(filters)
        .sort()
        .reduce<Record<string, unknown>>((accumulator, key) => {
            accumulator[key] = filters[key];

            return accumulator;
        }, {});

    return createHash('md5').update(JSON.stringify(sorted)).digest('hex');
}

export function md5(value: string): string {
    return createHash('md5').update(value).digest('hex');
}
