import { remember, TTL } from '@/lib/cache';
import { tmdbRequest } from './client';
import type { Collection, CombinedCredits, Genre, Images, PaginatedResponse, Person } from './types';

/** Genres, collections, people, and cross-source lookups. */

export function getMovieGenres(): Promise<Genre[]> {
    return remember('tmdb.genres.movie', TTL.days(30), async () => {
        const response = await tmdbRequest<{ genres: Genre[] }>('genre/movie/list');

        return response.genres.map((genre) => ({ id: genre.id, name: genre.name }));
    });
}

export function getTvGenres(): Promise<Genre[]> {
    return remember('tmdb.genres.tv', TTL.days(30), async () => {
        const response = await tmdbRequest<{ genres: Genre[] }>('genre/tv/list');

        return response.genres.map((genre) => ({ id: genre.id, name: genre.name }));
    });
}

export function getCollection(collectionId: number): Promise<Collection> {
    return remember(`tmdb.collection.${collectionId}`, TTL.days(7), () => tmdbRequest<Collection>(`collection/${collectionId}`));
}

export function getCollectionImages(collectionId: number): Promise<Images> {
    return remember(`tmdb.collection.${collectionId}.images`, TTL.days(7), () =>
        tmdbRequest<Images>(`collection/${collectionId}/images`),
    );
}

export function getPerson(personId: number, withCredits = true): Promise<Person> {
    return remember(`tmdb.person.${personId}${withCredits ? '.full' : ''}`, TTL.days(30), () =>
        tmdbRequest<Person>(`person/${personId}`, {
            append_to_response: withCredits ? 'combined_credits,images,external_ids' : undefined,
        }),
    );
}

export function getPersonCombinedCredits(personId: number): Promise<CombinedCredits> {
    return remember(`tmdb.person.${personId}.combined_credits`, TTL.days(30), () =>
        tmdbRequest<CombinedCredits>(`person/${personId}/combined_credits`),
    );
}

export function getPopularPeople(page = 1): Promise<PaginatedResponse<Person>> {
    return remember(`tmdb.person.popular.page.${page}`, TTL.hours(6), () =>
        tmdbRequest<PaginatedResponse<Person>>('person/popular', { page }),
    );
}

export function findByImdbId(imdbId: string): Promise<{ movie_results: unknown[]; tv_results: unknown[] }> {
    return remember(`tmdb.find.imdb.${imdbId}`, TTL.days(30), () =>
        tmdbRequest<{ movie_results: unknown[]; tv_results: unknown[] }>(`find/${imdbId}`, { external_source: 'imdb_id' }),
    );
}
