import { Activity, Clapperboard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAuthState } from '@/server/auth/current-user';
import { HeaderSearch } from './header-search';
import { primaryNavItems } from './nav-config';
import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';

export async function SiteHeader() {
    const { user, impersonating } = await getAuthState();

    return (
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
            <div className="container mx-auto flex h-14 items-center gap-4 px-4">
                <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
                    <Clapperboard className="text-primary size-5" />
                    <span className="hidden sm:inline">Moviestrackr</span>
                </Link>

                <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
                    {primaryNavItems.map(({ href, label }) => (
                        <Button key={href} asChild variant="ghost" size="sm">
                            <Link href={href as never}>{label}</Link>
                        </Button>
                    ))}
                </nav>

                <div className="flex flex-1 justify-end">
                    <HeaderSearch />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {user ? (
                        <>
                            <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Feed">
                                <Link href="/feed">
                                    <Activity className="size-5" />
                                </Link>
                            </Button>
                            <NotificationBell userId={user.id} />
                            <UserMenu user={user} />
                        </>
                    ) : (
                        <>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link href="/register">Sign up</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {impersonating && (
                <p className="bg-warning text-warning-foreground px-4 py-1 text-center text-xs font-medium">
                    You are impersonating {user?.name}.
                </p>
            )}
        </header>
    );
}
