import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { MediaGridSkeleton } from '@/components/media/media-grid';
import { MediaRow } from '@/components/media/media-row';
import { Button } from '@/components/ui/button';
import { movies, tv } from '@/lib/tmdb';
import { getCurrentUser } from '@/server/auth/current-user';

export const metadata: Metadata = {
    title: 'Moviestrackr — Track movies and TV shows',
    description:
        'Browse trending movies and TV shows, track what you watch, rate and review titles, and follow what your friends are watching.',
};

export const revalidate = 3600;

async function safeResults<T>(request: Promise<{ results: T[] }>): Promise<T[]> {
    try {
        return (await request).results;
    } catch (error) {
        console.warn('[home] TMDB request failed', error);

        return [];
    }
}

async function TrendingRows() {
    const [popularMovies, topRatedMovies, popularShows, onTheAir] = await Promise.all([
        safeResults(movies.getPopular(1)),
        safeResults(movies.getTopRated(1)),
        safeResults(tv.getPopular(1)),
        safeResults(tv.getOnTheAir(1)),
    ]);

    const everythingFailed = [popularMovies, topRatedMovies, popularShows, onTheAir].every((results) => results.length === 0);

    if (everythingFailed) {
        return (
            <p className="text-muted-foreground py-16 text-center text-sm" role="status">
                Movie data is temporarily unavailable. Please try again shortly.
            </p>
        );
    }

    return (
        <div className="space-y-10">
            <MediaRow title="Popular Movies" items={popularMovies} mediaType="movie" href="/movies?category=popular" />
            <MediaRow title="Popular TV Shows" items={popularShows} mediaType="tv" href="/tv?category=popular" />
            <MediaRow title="Top Rated Movies" items={topRatedMovies} mediaType="movie" href="/movies?category=top_rated" />
            <MediaRow title="On The Air" items={onTheAir} mediaType="tv" href="/tv?category=on_the_air" />
        </div>
    );
}

export default async function HomePage() {
    const user = await getCurrentUser();

    return (
        <div className="space-y-10">
            {!user && (
                <section className="from-surface-primary to-background rounded-xl bg-gradient-to-br p-8 text-center sm:p-12">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Every movie and show you watch, in one place</h1>
                    <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
                        Track your watchlist across five statuses, rate and review what you finish, tick off episodes as you go,
                        and see what your friends are watching.
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                        <Button asChild size="lg">
                            <Link href="/register">Create an account</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href="/movies">Browse movies</Link>
                        </Button>
                    </div>
                </section>
            )}

            {user && <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user.name.split(' ')[0]}</h1>}

            <Suspense fallback={<MediaGridSkeleton count={12} />}>
                <TrendingRows />
            </Suspense>
        </div>
    );
}
