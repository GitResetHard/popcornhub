'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RATING_OPTIONS } from '@/lib/browse';
import { internalHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { Genre } from '@/lib/tmdb';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, index) => CURRENT_YEAR - index);

export type BrowseFiltersProps = {
    basePath: '/movies' | '/tv';
    categories: Array<{ value: string; label: string }>;
    sorts: Array<{ value: string; label: string }>;
    genres: Genre[];
};

export function BrowseFilters({ basePath, categories, sorts, genres }: BrowseFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const category = searchParams.get('category') ?? 'popular';
    const activeGenre = searchParams.get('genre') ?? '';
    const activeYear = searchParams.get('year') ?? '';
    const activeSort = searchParams.get('sort') ?? '';
    const activeRating = searchParams.get('rating') ?? '';
    const hasFilters = Boolean(activeGenre || activeYear || activeSort || activeRating);

    function update(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        params.delete('page');

        const query = params.toString();
        router.push(internalHref(query ? `${pathname}?${query}` : pathname));
    }

    function hrefForCategory(value: string): string {
        const params = new URLSearchParams();

        if (value !== 'popular') {
            params.set('category', value);
        }

        const query = params.toString();

        return query ? `${basePath}?${query}` : basePath;
    }

    return (
        <div className="space-y-4">
            <nav aria-label="Categories" className="hide-scrollbar flex gap-2 overflow-x-auto">
                {categories.map(({ value, label }) => (
                    <Button key={value} asChild size="sm" variant={category === value && !hasFilters ? 'default' : 'outline'}>
                        <Link href={internalHref(hrefForCategory(value))}>{label}</Link>
                    </Button>
                ))}
            </nav>

            <div className="flex flex-wrap items-center gap-2">
                <FilterSelect
                    label="Genre"
                    value={activeGenre}
                    onChange={(value) => update('genre', value)}
                    options={genres.map((genre) => ({ value: String(genre.id), label: genre.name }))}
                />
                <FilterSelect
                    label="Year"
                    value={activeYear}
                    onChange={(value) => update('year', value)}
                    options={YEARS.map((year) => ({ value: String(year), label: String(year) }))}
                />
                <FilterSelect
                    label="Min rating"
                    value={activeRating}
                    onChange={(value) => update('rating', value)}
                    options={RATING_OPTIONS.map((rating) => ({ value: String(rating), label: `${rating}+` }))}
                />
                <FilterSelect label="Sort by" value={activeSort} onChange={(value) => update('sort', value)} options={sorts} />

                {hasFilters && (
                    <Button asChild variant="ghost" size="sm">
                        <Link href={basePath}>
                            <X className="size-3.5" />
                            Clear filters
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

function FilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
}) {
    return (
        <label className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={cn(
                    'border-input bg-background h-8 rounded-md border px-2 text-sm shadow-xs',
                    'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
                )}
            >
                <option value="">Any</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
