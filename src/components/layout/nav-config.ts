import {
    Activity,
    Bookmark,
    BookmarkCheck,
    CalendarDays,
    Clapperboard,
    Film,
    Heart,
    Home,
    List,
    Sparkles,
    Trophy,
    Tv,
    type LucideIcon,
} from 'lucide-react';

export type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    migrated?: boolean;
};

export const primaryNavItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/movies', label: 'Movies', icon: Film },
    { href: '/tv', label: 'TV Shows', icon: Tv },
];

export const signedInQuickItems: NavItem[] = [
    { href: '/feed', label: 'Feed', icon: Activity },
    { href: '/watchlist', label: 'Watchlist', icon: Bookmark },
    { href: '/favorites', label: 'Favorites', icon: Heart },
    { href: '/clips/bookmarks', label: 'Saved Clips', icon: BookmarkCheck },
    { href: '/recommendations', label: 'For You', icon: Sparkles },
    { href: '/lists', label: 'My Lists', icon: List },
    { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/clips', label: 'Clips', icon: Clapperboard },
];
