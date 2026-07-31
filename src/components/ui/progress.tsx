import type * as React from 'react';
import { cn } from '@/lib/utils';

function Progress({
    value = 0,
    size = 'md',
    color = 'primary',
    className,
    ...props
}: Omit<React.ComponentProps<'div'>, 'color'> & {
    value?: number;
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'success' | 'warning' | 'danger';
}) {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <div
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cn('bg-content-3 w-full overflow-hidden rounded-full', { sm: 'h-1', md: 'h-2', lg: 'h-3' }[size], className)}
            {...props}
        >
            <div
                className={cn(
                    'h-full rounded-full transition-[width] duration-300',
                    { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' }[color],
                )}
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}

export { Progress };
