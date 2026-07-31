import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/images';

export type CastEntry = {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
};

export function CastList({ cast, viewAllHref }: { cast: CastEntry[]; viewAllHref?: string }) {
    if (cast.length === 0) {
        return null;
    }

    return (
        <section className="space-y-3">
            <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold sm:text-xl">Top Billed Cast</h2>
                {viewAllHref && (
                    <Link href={viewAllHref as never} className="text-primary text-sm hover:underline">
                        Full cast &amp; crew
                    </Link>
                )}
            </div>

            <ul className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
                {cast.slice(0, 12).map((member) => (
                    <li key={`${member.id}-${member.character}`} className="w-28 shrink-0 sm:w-32">
                        <Link href={`/people/${member.id}` as never} className="group block">
                            <div className="bg-muted relative aspect-[2/3] overflow-hidden rounded-lg">
                                <Image
                                    src={getImageUrl(member.profile_path, 'w185')}
                                    alt={member.name}
                                    fill
                                    sizes="128px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    unoptimized={!member.profile_path}
                                />
                            </div>
                            <p className="mt-1.5 truncate text-sm font-medium">{member.name}</p>
                            <p className="text-muted-foreground truncate text-xs">{member.character}</p>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
