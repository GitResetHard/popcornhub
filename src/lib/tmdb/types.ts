/** TMDB API v3 response shapes. */

export interface Genre {
    id: number;
    name: string;
}

export interface ProductionCompany {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
}

export interface ProductionCountry {
    iso_3166_1: string;
    name: string;
}

export interface SpokenLanguage {
    iso_639_1: string;
    name: string;
    english_name: string;
}

export interface CastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

export interface CrewMember {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
}

export interface Credits {
    cast: CastMember[];
    crew: CrewMember[];
}

export interface Video {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

export interface VideoResults {
    results: Video[];
}

export interface TmdbReview {
    id: string;
    author: string;
    author_details: {
        name: string;
        username: string;
        avatar_path: string | null;
        rating: number | null;
    };
    content: string;
    created_at: string;
    updated_at: string;
    url: string;
}

export interface ReviewResults {
    results: TmdbReview[];
}

export interface PaginatedResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

export interface MovieSummary {
    id: number;
    title: string;
    original_title?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids?: number[];
    adult?: boolean;
}

export interface BelongsToCollection {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
}

export interface WatchProviderOption {
    provider_id: number;
    provider_name: string;
    logo_path: string | null;
    display_priority?: number;
}

export interface WatchProviderRegion {
    link?: string;
    flatrate?: WatchProviderOption[];
    rent?: WatchProviderOption[];
    buy?: WatchProviderOption[];
    free?: WatchProviderOption[];
}

export interface WatchProviders {
    results: Record<string, WatchProviderRegion>;
}

export interface Movie extends MovieSummary {
    imdb_id?: string | null;
    genres: Genre[];
    runtime: number | null;
    budget: number;
    revenue: number;
    tagline: string | null;
    status: string;
    production_companies: ProductionCompany[];
    production_countries: ProductionCountry[];
    spoken_languages: SpokenLanguage[];
    belongs_to_collection?: BelongsToCollection | null;
    credits?: Credits;
    videos?: VideoResults;
    reviews?: ReviewResults;
    similar?: PaginatedResponse<MovieSummary>;
    recommendations?: PaginatedResponse<MovieSummary>;
    'watch/providers'?: WatchProviders;
}

export interface Season {
    id: number;
    season_number: number;
    name: string;
    overview: string;
    poster_path: string | null;
    air_date: string;
    episode_count: number;
    vote_average?: number;
}

export interface Episode {
    id: number;
    episode_number: number;
    season_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date: string;
    vote_average: number;
    vote_count: number;
    runtime?: number | null;
}

export interface SeasonDetail extends Season {
    episodes: Episode[];
}

export interface Creator {
    id: number;
    name: string;
    profile_path: string | null;
}

export interface Network {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
}

export interface TvShowSummary {
    id: number;
    name: string;
    original_name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids?: number[];
}

export interface TvShow extends TvShowSummary {
    imdb_id?: string | null;
    last_air_date: string;
    genres: Genre[];
    episode_run_time: number[];
    status: string;
    tagline: string | null;
    number_of_seasons: number;
    number_of_episodes: number;
    seasons: Season[];
    production_companies: ProductionCompany[];
    production_countries: ProductionCountry[];
    spoken_languages: SpokenLanguage[];
    created_by: Creator[];
    networks: Network[];
    next_episode_to_air?: Episode | null;
    last_episode_to_air?: Episode | null;
    credits?: Credits;
    videos?: VideoResults;
    similar?: PaginatedResponse<TvShowSummary>;
    recommendations?: PaginatedResponse<TvShowSummary>;
    'watch/providers'?: WatchProviders;
}

export interface Person {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;
    popularity: number;
    biography?: string;
    birthday?: string | null;
    deathday?: string | null;
    place_of_birth?: string | null;
    imdb_id?: string | null;
    also_known_as?: string[];
}

export interface PersonCredit {
    id: number;
    media_type: 'movie' | 'tv';
    title?: string;
    name?: string;
    character?: string;
    job?: string;
    department?: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    vote_count: number;
    episode_count?: number;
    order?: number;
}

export interface CombinedCredits {
    cast: PersonCredit[];
    crew: PersonCredit[];
}

export interface TmdbImage {
    file_path: string;
    width: number;
    height: number;
    aspect_ratio: number;
    vote_average: number;
    iso_639_1?: string | null;
}

export interface Images {
    backdrops: TmdbImage[];
    posters: TmdbImage[];
    logos: TmdbImage[];
}

export interface Collection {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    parts: MovieSummary[];
}

export interface SearchResult {
    id: number;
    media_type: 'movie' | 'tv' | 'person';
    title?: string;
    name?: string;
    poster_path?: string | null;
    profile_path?: string | null;
    backdrop_path?: string | null;
    overview?: string;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
    known_for_department?: string;
    known_for?: Array<{ id: number; media_type: 'movie' | 'tv'; title?: string; name?: string }>;
}

export interface Keyword {
    id: number;
    name: string;
}

export interface KeywordResults {
    id: number;
    keywords?: Keyword[];
    results?: Keyword[];
}

export interface AggregateCastMember {
    id: number;
    name: string;
    profile_path: string | null;
    total_episode_count: number;
    order: number;
    roles: Array<{ credit_id: string; character: string; episode_count: number }>;
}

export interface AggregateCrewMember {
    id: number;
    name: string;
    profile_path: string | null;
    department: string;
    total_episode_count: number;
    jobs: Array<{ credit_id: string; job: string; episode_count: number }>;
}

export interface AggregateCredits {
    cast: AggregateCastMember[];
    crew: AggregateCrewMember[];
}

export interface ExternalIds {
    imdb_id: string | null;
    tvdb_id: number | null;
    facebook_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
}

export type DiscoverFilters = {
    sort_by?: string;
    with_genres?: string;
    primary_release_year?: number | string;
    first_air_date_year?: number | string;
    'vote_average.gte'?: number | string;
    'vote_count.gte'?: number | string;
    with_original_language?: string;
};
