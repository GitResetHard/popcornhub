import { Award, CalendarDays, Clock, Film, Heart, ListChecks, Star } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/layout/empty-state';
import { SectionHeader } from '@/components/layout/section-header';
import { StatCard } from '@/components/layout/stat-card';
import { UserAvatar } from '@/components/layout/user-avatar';
import { LevelProgress } from '@/components/gamification/level-progress';
import { StarDisplay } from '@/components/media/star-rating';
import { ActivityItem } from '@/components/social/activity-item';
import { FollowButton } from '@/components/social/follow-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { internalHref } from '@/lib/routes';
import { getCurrentUser } from '@/server/auth/current-user';
import { countFollowers, countFollowing, isFollowing } from '@/server/services/follows';
import { getEarnedAchievements, getLevelInfo, getStreakInfo } from '@/server/services/gamification';
import { countUserLists, getUserLists } from '@/server/services/lists';
import { getProfileStats, getRecentActivity } from '@/server/services/profile';
import { countUserReviews, getUserReviews } from '@/server/services/reviews';
import { getPublicProfile } from '@/server/services/users';

type PageParams = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
    const { username } = await params;
    const profile = await getPublicProfile(username);

    if (!profile) {
        return { title: 'Member not found' };
    }

    return { title: `${profile.name} (@${profile.username})`, description: profile.bio ?? `${profile.name}'s profile on Moviestrackr.` };
}

export default async function ProfilePage({ params }: { params: PageParams }) {
    const { username } = await params;
    const profile = await getPublicProfile(username);

    if (!profile) {
        notFound();
    }

    const viewer = await getCurrentUser();
    const isSelf = viewer?.id === profile.id;

    const [stats, level, streak, achievements, followers, following, viewerFollows, lists, listCount, reviews, reviewCount] = await Promise.all([
        getProfileStats(profile.id),
        getLevelInfo(profile.id),
        getStreakInfo(profile.id),
        getEarnedAchievements(profile.id),
        countFollowers(profile.id),
        countFollowing(profile.id),
        viewer && !isSelf ? isFollowing(viewer.id, profile.id) : Promise.resolve(false),
        getUserLists(profile.id),
        countUserLists(profile.id),
        getUserReviews(profile.id, 6),
        countUserReviews(profile.id),
    ]);

    const recentActivity = await getRecentActivity(profile.id, 10);
    const visibleLists = isSelf ? lists : lists.filter((list) => list.visibility === 'public');

    return (
        <div className="space-y-8">
            <header className="bg-card flex flex-col gap-5 rounded-2xl border p-6 sm:flex-row sm:items-center">
                <UserAvatar name={profile.name} avatar={profile.avatar} className="size-20 text-xl" />
                <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
                        {profile.isAdmin && <Badge variant="secondary">Admin</Badge>}
                        {profile.isBanned && <Badge variant="destructive">Suspended</Badge>}
                    </div>
                    <p className="text-muted-foreground text-sm">@{profile.username}</p>
                    {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
                    <div className="text-muted-foreground flex flex-wrap gap-4 pt-2 text-sm">
                        <span>
                            <strong className="text-foreground">{followers}</strong> followers
                        </span>
                        <span>
                            <strong className="text-foreground">{following}</strong> following
                        </span>
                        {streak.current > 0 && (
                            <span>
                                <strong className="text-foreground">{streak.current}</strong> day streak
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {isSelf ? (
                        <Button asChild variant="outline" size="sm">
                            <Link href="/settings/profile">Edit profile</Link>
                        </Button>
                    ) : viewer ? (
                        <FollowButton userId={profile.id} username={profile.username} initialFollowing={viewerFollows} />
                    ) : (
                        <Button asChild size="sm">
                            <Link href="/login">Follow</Link>
                        </Button>
                    )}
                </div>
            </header>

            <div className="bg-card rounded-2xl border p-6">
                <LevelProgress level={level.level} points={level.points} nextLevelAt={level.next_level_at} />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Tracked" value={stats.total_items} icon={Film} />
                <StatCard label="Completed" value={stats.completed} icon={ListChecks} />
                <StatCard label="Hours" value={stats.hours_watched} icon={Clock} />
                <StatCard label="Favorites" value={stats.favorites} icon={Heart} />
                <StatCard label="Reviews" value={reviewCount} icon={Star} />
                <StatCard label="Lists" value={listCount} icon={ListChecks} />
            </div>

            {achievements.length > 0 && (
                <section className="space-y-3">
                    <SectionHeader title="Achievements" />
                    <div className="flex flex-wrap gap-2">
                        {achievements.map((achievement) => (
                            <Badge key={achievement.name} variant="secondary" className="gap-1.5 px-3 py-1">
                                <Award className="size-3.5" />
                                {achievement.name}
                            </Badge>
                        ))}
                    </div>
                </section>
            )}

            {visibleLists.length > 0 && (
                <section className="space-y-3">
                    <SectionHeader title="Lists" />
                    <div className="grid gap-3 sm:grid-cols-2">
                        {visibleLists.map((list) => (
                            <Link
                                key={list.id}
                                href={internalHref(`/lists/${list.slug}`)}
                                className="bg-card hover:border-primary/50 rounded-xl border p-4 transition"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="truncate font-semibold">{list.name}</h3>
                                    {list.visibility === 'private' && <Badge variant="outline">Private</Badge>}
                                </div>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {list.itemsCount ?? 0} titles · {list.likesCount ?? 0} likes
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {reviews.length > 0 && (
                <section className="space-y-3">
                    <SectionHeader title="Recent reviews" />
                    <div className="space-y-3">
                        {reviews.map((review) => (
                            <article key={review.id} className="bg-card rounded-xl border p-4">
                                <div className="flex items-center gap-2">
                                    <StarDisplay rating={review.rating} />
                                    <Link
                                        href={internalHref(`/${review.mediaType === 'movie' ? 'movies' : 'tv'}/${review.tmdbId}`)}
                                        className="text-sm font-medium hover:underline"
                                    >
                                        {review.title || `${review.mediaType === 'movie' ? 'Movie' : 'Show'} #${review.tmdbId}`}
                                    </Link>
                                </div>
                                {review.content && <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">{review.content}</p>}
                            </article>
                        ))}
                    </div>
                </section>
            )}

            <section className="space-y-3">
                <SectionHeader title="Recent activity" />
                {recentActivity.length === 0 ? (
                    <EmptyState icon={CalendarDays} title="No activity yet" />
                ) : (
                    <div className="space-y-3">
                        {recentActivity.map((activity) => (
                            <ActivityItem
                                key={activity.id}
                                showAuthor={false}
                                item={{
                                    id: activity.id,
                                    type: activity.type,
                                    tmdbId: activity.tmdb_id,
                                    mediaType: activity.media_type,
                                    metadata: activity.metadata,
                                    createdAt: activity.created_at,
                                }}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
