import { format } from 'date-fns';
import { Activity, Film, Heart, List, Shield, Star, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { StatCard } from '@/components/layout/stat-card';
import { UserAvatar } from '@/components/layout/user-avatar';
import { Badge } from '@/components/ui/badge';
import { internalHref } from '@/lib/routes';
import Link from 'next/link';
import { getCurrentUser } from '@/server/auth/current-user';
import { getAdminStats, getRecentUsers } from '@/server/services/admin';

export const metadata: Metadata = { title: 'Admin Dashboard', robots: { index: false, follow: false } };

export default async function AdminDashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?redirect=/admin/dashboard');
    }

    if (!user.is_admin) {
        redirect('/');
    }

    const [stats, recentUsers] = await Promise.all([getAdminStats(), getRecentUsers(15)]);

    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <Shield className="text-primary size-6" /> Admin Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">A snapshot of activity across the platform.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Users" value={stats.users} icon={Users} />
                <StatCard label="Tracked" value={stats.watchlistItems} icon={Film} />
                <StatCard label="Reviews" value={stats.reviews} icon={Star} />
                <StatCard label="Lists" value={stats.lists} icon={List} />
                <StatCard label="Favorites" value={stats.favorites} icon={Heart} />
                <StatCard label="Activities" value={stats.activities} icon={Activity} />
            </div>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold">Newest members</h2>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
                            <tr>
                                <th className="p-3 font-medium">Member</th>
                                <th className="p-3 font-medium">Email</th>
                                <th className="p-3 font-medium">Joined</th>
                                <th className="p-3 font-medium">Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentUsers.map((row) => (
                                <tr key={row.id} className="border-t">
                                    <td className="p-3">
                                        <Link href={internalHref(`/users/${row.username}`)} className="flex items-center gap-2 hover:underline">
                                            <UserAvatar name={row.name} className="size-7" />
                                            <span className="font-medium">{row.name}</span>
                                        </Link>
                                    </td>
                                    <td className="text-muted-foreground p-3">{row.email}</td>
                                    <td className="text-muted-foreground p-3">{row.createdAt ? format(new Date(row.createdAt), 'MMM d, yyyy') : '—'}</td>
                                    <td className="p-3">
                                        {row.isBanned ? (
                                            <Badge variant="destructive">Banned</Badge>
                                        ) : row.isAdmin ? (
                                            <Badge variant="secondary">Admin</Badge>
                                        ) : (
                                            <Badge variant="outline">Member</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
