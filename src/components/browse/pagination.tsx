import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { internalHref } from '@/lib/routes';

export function Pagination({ page, lastPage, buildHref }: { page: number; lastPage: number; buildHref: (page: number) => string }) {
    if (lastPage <= 1) {
        return null;
    }

    const pages = new Set<number>([1, lastPage]);

    for (let candidate = page - 2; candidate <= page + 2; candidate += 1) {
        if (candidate >= 1 && candidate <= lastPage) {
            pages.add(candidate);
        }
    }

    const ordered = [...pages].sort((a, b) => a - b);

    return (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1 pt-8">
            <Button asChild={page > 1} variant="ghost" size="icon" disabled={page <= 1} aria-label="Previous page">
                {page > 1 ? (
                    <Link href={internalHref(buildHref(page - 1))} rel="prev">
                        <ChevronLeft className="size-4" />
                    </Link>
                ) : (
                    <ChevronLeft className="size-4" />
                )}
            </Button>

            {ordered.map((candidate, index) => {
                const previous = ordered[index - 1];
                const showEllipsis = previous !== undefined && candidate - previous > 1;

                return (
                    <span key={candidate} className="flex items-center gap-1">
                        {showEllipsis && (
                            <span className="text-muted-foreground px-1" aria-hidden="true">
                                …
                            </span>
                        )}
                        <Button
                            asChild
                            variant={candidate === page ? 'default' : 'ghost'}
                            size="icon"
                            aria-current={candidate === page ? 'page' : undefined}
                        >
                            <Link href={internalHref(buildHref(candidate))}>{candidate}</Link>
                        </Button>
                    </span>
                );
            })}

            <Button asChild={page < lastPage} variant="ghost" size="icon" disabled={page >= lastPage} aria-label="Next page">
                {page < lastPage ? (
                    <Link href={internalHref(buildHref(page + 1))} rel="next">
                        <ChevronRight className="size-4" />
                    </Link>
                ) : (
                    <ChevronRight className="size-4" />
                )}
            </Button>
        </nav>
    );
}
