/**
 * Domain enums for the app, mirrored from the reference implementation so the two agree on
 * the values that matter (statuses, XP awards, media types).
 */

export const MEDIA_TYPES = ['movie', 'tv', 'episode', 'person', 'collection', 'list'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const WATCHLIST_STATUSES = ['plan_to_watch', 'watching', 'completed', 'dropped', 'on_hold'] as const;
export type WatchlistStatus = (typeof WATCHLIST_STATUSES)[number];

export const LIST_VISIBILITIES = ['public', 'private'] as const;
export type ListVisibility = (typeof LIST_VISIBILITIES)[number];

export const ACTIVITY_TYPES = [
    'added_to_watchlist',
    'rated',
    'reviewed',
    'completed',
    'started_watching',
    'updated_status',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const REPORT_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const COLLABORATOR_ROLES = ['editor', 'viewer'] as const;
export type CollaboratorRole = (typeof COLLABORATOR_ROLES)[number];

export const COLLABORATOR_STATUSES = ['pending', 'accepted', 'rejected'] as const;
export type CollaboratorStatus = (typeof COLLABORATOR_STATUSES)[number];

const WATCHLIST_STATUS_LABELS: Record<WatchlistStatus, string> = {
    plan_to_watch: 'Plan to Watch',
    watching: 'Watching',
    completed: 'Completed',
    dropped: 'Dropped',
    on_hold: 'On Hold',
};

const WATCHLIST_STATUS_COLORS: Record<WatchlistStatus, string> = {
    plan_to_watch: 'blue',
    watching: 'green',
    completed: 'purple',
    dropped: 'red',
    on_hold: 'yellow',
};

export function watchlistStatusLabel(status: WatchlistStatus): string {
    return WATCHLIST_STATUS_LABELS[status];
}

export function watchlistStatusColor(status: WatchlistStatus): string {
    return WATCHLIST_STATUS_COLORS[status];
}

/** XP awards, mirrored from the reference implementation so balances mean the same thing. */
export const XP_ACTIONS = {
    add_to_watchlist: { points: 2, label: 'Added to Watchlist' },
    start_watching: { points: 3, label: 'Started Watching' },
    complete_movie: { points: 10, label: 'Completed Movie' },
    complete_tv_show: { points: 15, label: 'Completed TV Show' },
    watch_episode: { points: 1, label: 'Watched Episode' },
    watch_season: { points: 5, label: 'Watched Season' },
    write_review: { points: 20, label: 'Wrote Review' },
    follow_user: { points: 2, label: 'Followed User' },
    create_list: { points: 10, label: 'Created List' },
    add_item_to_list: { points: 1, label: 'Added Item to List' },
    favorite_title: { points: 1, label: 'Favorited Title' },
    like_list: { points: 1, label: 'Liked List' },
    comment_on_list: { points: 5, label: 'Commented on List' },
    import_csv: { points: 25, label: 'Imported CSV' },
    complete_collection: { points: 50, label: 'Completed Collection' },
} as const satisfies Record<string, { points: number; label: string }>;

export type XpAction = keyof typeof XP_ACTIONS;

export function xpPoints(action: XpAction): number {
    return XP_ACTIONS[action].points;
}

export function xpLabel(action: XpAction): string {
    return XP_ACTIONS[action].label;
}
