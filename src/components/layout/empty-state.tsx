import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Friendly empty/placeholder block used across list-style pages. */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="border-border/60 flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
            {Icon && (
                <div className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
                    <Icon className="size-6" />
                </div>
            )}
            <h3 className="text-base font-semibold">{title}</h3>
            {description && <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
