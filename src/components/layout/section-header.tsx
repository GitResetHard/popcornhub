import Link from 'next/link';
import type { Route } from 'next';
import type { ReactNode } from 'react';

/** Consistent section title with an optional description, "view all" link, or trailing slot. */
export function SectionHeader({
    title,
    description,
    href,
    linkLabel = 'View all',
    action,
}: {
    title: string;
    description?: string;
    href?: string;
    linkLabel?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="space-y-1">
                <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
                {description && <p className="text-muted-foreground text-sm">{description}</p>}
            </div>
            {action}
            {href && !action && (
                <Link href={href as Route} className="text-primary text-sm hover:underline">
                    {linkLabel}
                </Link>
            )}
        </div>
    );
}
