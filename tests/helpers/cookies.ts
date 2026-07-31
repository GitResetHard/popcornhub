/**
 * In-memory stand-in for the cookie store `next/headers` provides, so the session layer can
 * be exercised directly in tests.
 */

export type CookieJar = {
    get(name: string): { name: string; value: string } | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    delete(name: string): void;
    clear(): void;
};

export function createCookieJar(): CookieJar {
    const store = new Map<string, string>();

    return {
        get: (name) => (store.has(name) ? { name, value: store.get(name) as string } : undefined),
        set: (name, value) => {
            store.set(name, value);
        },
        delete: (name) => {
            store.delete(name);
        },
        clear: () => store.clear(),
    };
}

export const cookieJar = createCookieJar();
