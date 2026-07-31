'use client';

import { Loader2, Search, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { getImageUrl } from '@/lib/images';
import { cn } from '@/lib/utils';

type Suggestion = {
    id: number;
    media_type: 'movie' | 'tv' | 'person';
    title: string;
    year: string;
    poster_path: string | null;
};

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

function hrefFor(suggestion: Suggestion): string {
    switch (suggestion.media_type) {
        case 'tv':
            return `/tv/${suggestion.id}`;
        case 'person':
            return `/people/${suggestion.id}`;
        default:
            return `/movies/${suggestion.id}`;
    }
}

export function HeaderSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const trimmed = query.trim();
    const suggestions = trimmed.length >= MIN_QUERY_LENGTH ? results : [];

    useEffect(() => {
        const term = query.trim();

        if (term.length < MIN_QUERY_LENGTH) {
            return;
        }

        const controller = new AbortController();

        const timer = setTimeout(async () => {
            setIsLoading(true);

            try {
                const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(term)}`, {
                    signal: controller.signal,
                });

                if (response.ok) {
                    const data = (await response.json()) as { results: Suggestion[] };
                    setResults(data.results);
                    setIsOpen(true);
                }
            } catch {
                // An aborted request is the expected outcome while the user keeps typing.
            } finally {
                setIsLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [query]);

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);

        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        const term = query.trim();

        if (term) {
            setIsOpen(false);
            router.push(`/search?query=${encodeURIComponent(term)}` as never);
        }
    }

    return (
        <div ref={containerRef} className="relative w-full max-w-sm">
            <form onSubmit={submit} role="search">
                <label className="sr-only" htmlFor="header-search">
                    Search movies, TV shows, and people
                </label>
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                    id="header-search"
                    type="search"
                    value={query}
                    autoComplete="off"
                    placeholder="Search movies, shows, people…"
                    className="pl-8"
                    onChange={(event) => setQuery(event.target.value)}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                />
                {isLoading && (
                    <Loader2 className="text-muted-foreground absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin" />
                )}
                {!isLoading && query && (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setQuery('')}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </form>

            {isOpen && suggestions.length > 0 && (
                <ul className="bg-popover animate-fade-in absolute top-full z-50 mt-2 w-full overflow-hidden rounded-md border shadow-md">
                    {suggestions.map((suggestion) => (
                        <li key={`${suggestion.media_type}-${suggestion.id}`}>
                            <a
                                href={hrefFor(suggestion)}
                                className={cn('hover:bg-accent flex items-center gap-3 px-3 py-2 text-sm')}
                                onClick={() => setIsOpen(false)}
                            >
                                <div className="bg-muted relative h-12 w-8 shrink-0 overflow-hidden rounded">
                                    <Image
                                        src={getImageUrl(suggestion.poster_path, 'w92')}
                                        alt=""
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                        unoptimized={!suggestion.poster_path}
                                    />
                                </div>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{suggestion.title}</span>
                                    <span className="text-muted-foreground block text-xs capitalize">
                                        {suggestion.media_type}
                                        {suggestion.year && ` · ${suggestion.year}`}
                                    </span>
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
