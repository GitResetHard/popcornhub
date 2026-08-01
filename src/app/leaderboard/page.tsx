import { Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/layout/empty-state';
import { UserRow } from '@/components/social/user-row';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCurrentUser } from '@/server/auth/current-user';
import { getLeaderboard } from '@/server/services/users';

export const metadata: Metadata = { title: 'Leaderboard' };

const MEDALS = ['text-yellow-400', 'text-zinc-300', 'text-amber-600'];

export default async function LeaderboardPage() {
    const [entries, user] = await Promise.all([getLeaderboard(50), getCurrentUser()]);

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="space-y-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <Trophy className="text-primary size-6" /> Leaderboard
                </h1>
                <p className="text-muted-foreground text-sm">The most active members ranked by experience points.</p>
            </div>

            {entries.length === 0 ? (
                <EmptyState icon={Trophy} title="No rankings yet" description="Track titles and write reviews to earn XP and climb the board." />
            ) : (
                <ol className="space-y-2">
                    {entries.map((entry, index) => (
                        <li key={entry.id}>
                            <UserRow
                                name={entry.name}
                                username={entry.username}
                                avatar={entry.avatar}
                                subtitle={`Level ${entry.level} · ${entry.points.toLocaleString()} XP`}
                                leading={
                                    <span className={cn('w-6 text-center text-sm font-bold tabular-nums', MEDALS[index] ?? 'text-muted-foreground')}>
                                        {index + 1}
                                    </span>
                                }
                                trailing={entry.id === user?.id ? <Badge variant="secondary">You</Badge> : undefined}
                            />
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
