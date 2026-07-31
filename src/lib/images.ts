const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const PLACEHOLDER = '/placeholder-poster.svg';

export type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original';

export function getImageUrl(path: string | null | undefined, size: ImageSize = 'w500'): string {
    return path ? `${IMAGE_BASE}/${size}${path}` : PLACEHOLDER;
}

export function formatYear(date: string | null | undefined): string {
    if (!date) {
        return '';
    }

    const year = date.slice(0, 4);

    return /^\d{4}$/.test(year) ? year : '';
}

export function formatRuntime(minutes: number | null | undefined): string {
    if (!minutes || minutes <= 0) {
        return '';
    }

    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;

    return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}

export function formatVoteAverage(vote: number | null | undefined): string | null {
    return vote && vote > 0 ? Number(vote).toFixed(1) : null;
}
