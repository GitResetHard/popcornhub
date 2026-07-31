import type { Metadata } from 'next';
import { env } from '@/lib/env';
import type { Movie, TvShow } from '@/lib/tmdb';

const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const DESCRIPTION_LIMIT = 160;

function siteUrl(): string {
    return env.APP_URL.replace(/\/$/, '');
}

export function absoluteUrl(path: string): string {
    return `${siteUrl()}/${path.replace(/^\//, '')}`;
}

export function truncate(text: string, length = DESCRIPTION_LIMIT): string {
    const stripped = text.replace(/<[^>]*>/g, '');
    const characters = [...stripped];

    if (characters.length <= length) {
        return stripped;
    }

    return `${characters.slice(0, length - 1).join('')}…`;
}

function backdropImage(path: string | null | undefined): string | undefined {
    return path ? `${IMAGE_BASE}/w1280${path}` : undefined;
}

function extractYear(date: string | null | undefined): string {
    return date?.slice(0, 4) ?? '';
}

function genreNames(genres: Array<{ name: string }> | undefined): string {
    return (genres ?? []).map((genre) => genre.name).join(', ');
}

export function metadataForMovie(movie: Movie): Metadata {
    const title = movie.title || 'Movie';
    const description = movie.overview
        ? truncate(movie.overview)
        : truncate(`${title} (${extractYear(movie.release_date)}) - ${genreNames(movie.genres)}. Track, rate, and add to your watchlist.`);
    const image = backdropImage(movie.backdrop_path);
    const url = absoluteUrl(`/movies/${movie.id}`);

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'video.movie',
            images: image ? [image] : undefined,
            releaseDate: movie.release_date || undefined,
        },
        twitter: { card: image ? 'summary_large_image' : 'summary', title, description, images: image ? [image] : undefined },
    };
}

export function metadataForTvShow(show: TvShow): Metadata {
    const title = show.name || 'TV Show';
    const description = show.overview
        ? truncate(show.overview)
        : truncate(
              `${title} (${extractYear(show.first_air_date)}) - ${genreNames(show.genres)} TV series. Track episodes, rate, and add to your watchlist.`,
          );
    const image = backdropImage(show.backdrop_path);
    const url = absoluteUrl(`/tv/${show.id}`);

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, type: 'video.tv_show', images: image ? [image] : undefined },
        twitter: { card: image ? 'summary_large_image' : 'summary', title, description, images: image ? [image] : undefined },
    };
}

export function movieJsonLd(movie: Movie): Record<string, unknown> {
    const director = movie.credits?.crew.find((member) => member.job === 'Director');
    const actors = (movie.credits?.cast ?? []).slice(0, 5).map((actor) => ({ '@type': 'Person', name: actor.name }));

    return {
        '@context': 'https://schema.org',
        '@type': 'Movie',
        name: movie.title,
        description: movie.overview ?? null,
        url: absoluteUrl(`/movies/${movie.id}`),
        ...(movie.poster_path ? { image: `${IMAGE_BASE}/w500${movie.poster_path}` } : {}),
        ...(movie.release_date ? { datePublished: movie.release_date } : {}),
        ...(director ? { director: { '@type': 'Person', name: director.name } } : {}),
        ...(actors.length > 0 ? { actor: actors } : {}),
        ...(movie.vote_average && movie.vote_count
            ? {
                  aggregateRating: {
                      '@type': 'AggregateRating',
                      ratingValue: movie.vote_average,
                      ratingCount: movie.vote_count,
                      bestRating: 10,
                      worstRating: 0,
                  },
              }
            : {}),
    };
}

export function tvShowJsonLd(show: TvShow): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'TVSeries',
        name: show.name,
        description: show.overview ?? null,
        url: absoluteUrl(`/tv/${show.id}`),
        ...(show.poster_path ? { image: `${IMAGE_BASE}/w500${show.poster_path}` } : {}),
        ...(show.first_air_date ? { startDate: show.first_air_date } : {}),
        ...(show.number_of_seasons ? { numberOfSeasons: show.number_of_seasons } : {}),
        ...(show.number_of_episodes ? { numberOfEpisodes: show.number_of_episodes } : {}),
        ...(show.vote_average && show.vote_count
            ? {
                  aggregateRating: {
                      '@type': 'AggregateRating',
                      ratingValue: show.vote_average,
                      ratingCount: show.vote_count,
                      bestRating: 10,
                      worstRating: 0,
                  },
              }
            : {}),
    };
}
