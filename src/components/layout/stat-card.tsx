import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Compact metric tile used on profile, dashboard, and admin pages. */
export function StatCard({
    label,
    value,
    icon: Icon,
    hint,
    className,
}: {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    hint?: string;
    className?: string;
}) {
    return (
        <div className={cn('bg-card rounded-xl border p-4', className)}>
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
                {Icon && <Icon className="text-muted-foreground size-4" />}
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
        </div>
    );
}
