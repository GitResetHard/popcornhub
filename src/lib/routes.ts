import type { Route } from 'next';

/**
 * Marks a URL this app owns that is built at runtime (a paginated or filtered listing), which
 * typedRoutes cannot verify statically. Keeps the cast in one reviewable place.
 */
export function internalHref(href: string): Route {
    return href as Route;
}
