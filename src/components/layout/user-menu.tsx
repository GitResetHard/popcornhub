'use client';

import { LogOut, Settings, Shield, User } from 'lucide-react';
import { useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/server/actions/auth';
import type { AuthUser } from '@/server/auth/current-user';
import { signedInQuickItems } from './nav-config';

export function UserMenu({ user }: { user: AuthUser }) {
    const [isPending, startTransition] = useTransition();

    const initials = user.name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger aria-label="Open account menu" className="rounded-full outline-offset-2">
                <Avatar className="size-8">
                    {user.avatar && <AvatarImage src={user.avatar} alt="" />}
                    <AvatarFallback>{initials || 'U'}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <span className="block truncate">{user.name}</span>
                    <span className="text-muted-foreground block truncate text-xs font-normal">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <a href={`/users/${user.username}`}>
                        <User className="size-4" />
                        <span>Profile</span>
                    </a>
                </DropdownMenuItem>

                {signedInQuickItems.map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild>
                        <a href={href}>
                            <Icon className="size-4" />
                            <span>{label}</span>
                        </a>
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <a href="/settings/profile">
                        <Settings className="size-4" />
                        <span>Settings</span>
                    </a>
                </DropdownMenuItem>

                {user.is_admin && (
                    <DropdownMenuItem asChild>
                        <a href="/admin/dashboard">
                            <Shield className="size-4" />
                            <span>Admin</span>
                        </a>
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    variant="destructive"
                    disabled={isPending}
                    onSelect={(event) => {
                        event.preventDefault();
                        startTransition(() => {
                            void signOut();
                        });
                    }}
                >
                    <LogOut className="size-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
