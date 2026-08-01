import { format, parseISO } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/layout/empty-state';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/images';
import { internalHref } from '@/lib/routes';
import { getCurrentUser } from '@/server/auth/current-user';
import { getUpcomingSchedule, type CalendarEntry } from '@/server/services/discovery';

export const metadata: Metadata = { title: 'Release Calendar', robots: { index: false, follow: false } };

function groupByDate(entries: CalendarEntry[]): Array<{ date: string; entries: CalendarEntry[] }> {
    const groups = new Map<string, CalendarEntry[]>();

    for (const entry of entries) {
        const list = groups.get(entry.date) ?? [];
        list.push(entry);
        groups.set(entry.date, list);
    }

    return [...groups.entries()].map(([date, dateEntries]) => ({ date, entries: dateEntries }));
}

export default async function CalendarPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?redirect=/calendar');
    }

    const schedule = await getUpcomingSchedule(user.id);
    const groups = groupByDate(schedule);

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="space-y-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <CalendarDays className="text-primary size-6" /> Release Calendar
                </h1>
                <p className="text-muted-foreground text-sm">Upcoming episodes for shows you track and releases of movies you plan to watch.</p>
            </div>

            {groups.length === 0 ? (
                <EmptyState
                    icon={CalendarDays}
                    title="Nothing upcoming"
                    description="Add shows you're watching and movies you plan to watch to populate your calendar."
                />
            ) : (
                <div className="space-y-8">
                    {groups.map((group) => (
                        <section key={group.date} className="space-y-3">
                            <h2 className="text-muted-foreground text-sm font-semibold">{format(parseISO(group.date), 'EEEE, MMMM d, yyyy')}</h2>
                            <div className="space-y-2">
                                {group.entries.map((entry) => (
                                    <Link
                                        key={entry.key}
                                        href={internalHref(`/${entry.mediaType === 'movie' ? 'movies' : 'tv'}/${entry.tmdbId}`)}
                                        className="bg-card hover:border-primary/50 flex items-center gap-3 rounded-xl border p-3 transition"
                                    >
                                        <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md">
                                            <Image
                                                src={getImageUrl(entry.posterPath, 'w185')}
                                                alt=""
                                                fill
                                                sizes="44px"
                                                className="object-cover"
                                                unoptimized={!entry.posterPath}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{entry.title}</p>
                                            <p className="text-muted-foreground truncate text-sm">{entry.label}</p>
                                        </div>
                                        <Badge variant={entry.mediaType === 'movie' ? 'secondary' : 'outline'}>
                                            {entry.mediaType === 'movie' ? 'Movie' : 'Episode'}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
