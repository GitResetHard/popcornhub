// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression coverage for the quick-action controls on a media card: an earlier implementation
 * tracked hover in React state and mounted the controls conditionally, which closed the status
 * dropdown before a status could be picked. Hover is now CSS and the controls stay mounted.
 */

const setWatchlistStatus = vi.fn(async () => ({ ok: true as const, data: { status: 'completed' } }));
const removeFromWatchlist = vi.fn(async () => ({ ok: true as const, data: undefined }));
const toggleFavorite = vi.fn(async () => ({ ok: true as const, data: { favorited: true } }));
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('@/server/actions/tracking', () => ({
    setWatchlistStatus: (...args: unknown[]) => setWatchlistStatus(...(args as [])),
    removeFromWatchlist: (...args: unknown[]) => removeFromWatchlist(...(args as [])),
    toggleFavorite: (...args: unknown[]) => toggleFavorite(...(args as [])),
}));

vi.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...(args as [])),
        error: (...args: unknown[]) => toastError(...(args as [])),
    },
}));

vi.mock('next/image', () => ({
    default: ({ alt }: { alt: string }) => <span data-testid="poster" aria-label={alt} />,
}));

const { MediaCard } = await import('@/components/media/media-card');

const FIGHT_CLUB = {
    id: 550,
    title: 'Fight Club',
    poster_path: '/poster.jpg',
    release_date: '1999-10-15',
    vote_average: 8.4,
    overview: 'A ticking-time-bomb insomniac.',
};

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    cleanup();
});

describe('quick actions', () => {
    it('renders the controls without requiring a hover first', () => {
        render(<MediaCard item={FIGHT_CLUB} mediaType="movie" showQuickActions watchlistStatus="watching" />);

        expect(screen.getByRole('button', { name: 'Watchlist status: Watching' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeTruthy();
    });

    it('omits the controls when they are not enabled', () => {
        render(<MediaCard item={FIGHT_CLUB} mediaType="movie" />);

        expect(screen.queryByRole('button', { name: /Watchlist status/ })).toBeNull();
        expect(screen.queryByRole('button', { name: /favorites/ })).toBeNull();
    });

    it('opens the status menu with every watchlist status', async () => {
        const user = userEvent.setup();
        render(<MediaCard item={FIGHT_CLUB} mediaType="movie" showQuickActions watchlistStatus="watching" />);

        await user.click(screen.getByRole('button', { name: 'Watchlist status: Watching' }));

        const menu = await screen.findByRole('menu');

        for (const label of ['Plan to Watch', 'Watching', 'Completed', 'On Hold', 'Dropped']) {
            expect(within(menu).getByRole('menuitem', { name: new RegExp(label) })).toBeTruthy();
        }
    });

    it('keeps the trigger mounted after the pointer leaves the card', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <MediaCard item={FIGHT_CLUB} mediaType="movie" showQuickActions watchlistStatus="watching" />,
        );

        const card = container.firstElementChild as HTMLElement;

        await user.hover(card);
        await user.unhover(card);

        expect(screen.getByRole('button', { name: 'Watchlist status: Watching' })).toBeTruthy();
    });

    it('submits the chosen status and confirms with a toast', async () => {
        const user = userEvent.setup();
        render(<MediaCard item={FIGHT_CLUB} mediaType="movie" showQuickActions watchlistStatus="watching" />);

        await user.click(screen.getByRole('button', { name: 'Watchlist status: Watching' }));
        await user.click(await screen.findByRole('menuitem', { name: /Completed/ }));

        expect(setWatchlistStatus).toHaveBeenCalledWith({ tmdbId: 550, mediaType: 'movie', status: 'completed' });
        expect(toastSuccess).toHaveBeenCalledWith('Marked as Completed');
    });

    it('offers a remove option only for a tracked title', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<MediaCard item={FIGHT_CLUB} mediaType="movie" showQuickActions watchlistStatus={null} />);

        await user.click(screen.getByRole('button', { name: 'Add to watchlist' }));
        expect(screen.queryByRole('menuitem', { name: /Remove/ })).toBeNull();
        await user.keyboard('{Escape}');

        rerender(<MediaCard item={FIGHT_CLUB} mediaType="movie" showQuickActions watchlistStatus="watching" />);

        await user.click(screen.getByRole('button', { name: 'Watchlist status: Watching' }));
        await user.click(await screen.findByRole('menuitem', { name: /Remove/ }));

        expect(removeFromWatchlist).toHaveBeenCalledWith({ tmdbId: 550, mediaType: 'movie' });
        expect(toastSuccess).toHaveBeenCalledWith('Removed from your watchlist');
    });

    it('toggles a favorite and reflects the state to assistive technology', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<MediaCard item={FIGHT_CLUB} mediaType="movie" showQuickActions />);

        const heart = screen.getByRole('button', { name: 'Add to favorites' });

        expect(heart.getAttribute('aria-pressed')).toBe('false');

        await user.click(heart);

        expect(toggleFavorite).toHaveBeenCalledWith({ tmdbId: 550, mediaType: 'movie' });
        expect(toastSuccess).toHaveBeenCalledWith('Added to favorites');

        rerender(<MediaCard item={FIGHT_CLUB} mediaType="movie" showQuickActions isFavorite />);

        expect(screen.getByRole('button', { name: 'Remove from favorites' }).getAttribute('aria-pressed')).toBe('true');
    });

    it('surfaces the error from a rejected action', async () => {
        const user = userEvent.setup();
        toggleFavorite.mockResolvedValueOnce({ ok: false, error: 'Please sign in to continue.' } as never);

        render(<MediaCard item={FIGHT_CLUB} mediaType="movie" showQuickActions />);

        await user.click(screen.getByRole('button', { name: 'Add to favorites' }));

        expect(toastError).toHaveBeenCalledWith('Please sign in to continue.');
        expect(toastSuccess).not.toHaveBeenCalled();
    });
});

describe('card content', () => {
    it('links a movie to its detail page', () => {
        render(<MediaCard item={FIGHT_CLUB} mediaType="movie" />);

        for (const link of screen.getAllByRole('link')) {
            expect(link.getAttribute('href')).toBe('/movies/550');
        }
    });

    it('links a TV show to its detail page', () => {
        render(<MediaCard item={{ id: 1399, name: 'Game of Thrones', poster_path: null }} mediaType="tv" />);

        expect(screen.getAllByRole('link')[0]?.getAttribute('href')).toBe('/tv/1399');
    });

    it('points season and episode cards at their routes', () => {
        const { rerender } = render(
            <MediaCard item={{ id: 1, name: 'Season 1', poster_path: null, season_number: 1 }} mediaType="season" tvShowId={1399} />,
        );

        expect(screen.getAllByRole('link')[0]?.getAttribute('href')).toBe('/tv/1399/season/1');

        rerender(
            <MediaCard
                item={{ id: 2, name: 'Pilot', poster_path: null, season_number: 1, episode_number: 2 }}
                mediaType="episode"
                tvShowId={1399}
            />,
        );

        expect(screen.getAllByRole('link')[0]?.getAttribute('href')).toBe('/tv/1399/season/1/episode/2');
    });

    it('shows the year and status label under the poster', () => {
        render(<MediaCard item={FIGHT_CLUB} mediaType="movie" watchlistStatus="completed" />);

        expect(screen.getByText('1999')).toBeTruthy();
        expect(screen.getByText('Completed')).toBeTruthy();
    });

    it('renders season progress towards the episode count', () => {
        render(
            <MediaCard
                item={{ id: 1, name: 'Season 1', poster_path: null, season_number: 1, episode_count: 10 }}
                mediaType="season"
                tvShowId={1399}
                progress={{ watched: 4, total: 10, percent: 40, isCompleted: false }}
            />,
        );

        expect(screen.getByText('4/10 episodes')).toBeTruthy();
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('40');
    });
});
