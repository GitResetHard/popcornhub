'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Read-only star display (1–10 scale rendered as five stars). */
export function StarDisplay({ rating, className }: { rating: number; className?: string }) {
    const outOfFive = rating / 2;

    return (
        <div className={cn('flex items-center gap-0.5', className)} aria-label={`${rating} out of 10`}>
            {Array.from({ length: 5 }, (_, index) => {
                const filled = outOfFive - index;

                return (
                    <span key={index} className="relative">
                        <Star className="text-muted-foreground/40 size-4" />
                        {filled > 0 && (
                            <span className="absolute inset-0 overflow-hidden" style={{ width: `${Math.min(1, filled) * 100}%` }}>
                                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            </span>
                        )}
                    </span>
                );
            })}
        </div>
    );
}

/** Interactive 1–10 rating input backed by a hidden field named `rating`. */
export function StarInput({ name = 'rating', defaultValue = 0 }: { name?: string; defaultValue?: number }) {
    const [value, setValue] = useState(defaultValue);
    const [hover, setHover] = useState(0);
    const active = hover || value;

    return (
        <div className="flex items-center gap-2">
            <input type="hidden" name={name} value={value} />
            <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
                {Array.from({ length: 10 }, (_, index) => {
                    const score = index + 1;

                    return (
                        <button
                            key={score}
                            type="button"
                            aria-label={`Rate ${score} out of 10`}
                            onMouseEnter={() => setHover(score)}
                            onClick={() => setValue(score)}
                            className="p-0.5"
                        >
                            <Star className={cn('size-5 transition', score <= active ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40')} />
                        </button>
                    );
                })}
            </div>
            <span className="text-muted-foreground w-10 text-sm tabular-nums">{active ? `${active}/10` : '—'}</span>
        </div>
    );
}
