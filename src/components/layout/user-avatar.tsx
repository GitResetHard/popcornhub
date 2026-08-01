import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function initialsOf(name: string): string {
    return (
        name
            .split(' ')
            .map((part) => part[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'U'
    );
}

/** Presentational avatar that resolves initials from a display name. */
export function UserAvatar({ name, avatar, className }: { name: string; avatar?: string | null; className?: string }) {
    return (
        <Avatar className={cn('size-8', className)}>
            {avatar && <AvatarImage src={avatar} alt="" />}
            <AvatarFallback>{initialsOf(name)}</AvatarFallback>
        </Avatar>
    );
}
