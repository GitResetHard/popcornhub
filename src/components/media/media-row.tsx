import Link from 'next/link';
import { MediaCard, type MediaCardItem } from './media-card';

/** Horizontally scrolling row of posters; a scroll container needs no JavaScript. */
export function MediaRow({
    title,
    items,
    mediaType,
    href,
}: {
    title: string;
    items: MediaCardItem[];
    mediaType: 'movie' | 'tv';
    href?: string;
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <section className="space-y-3">
            <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
                {href && (
                    <Link href={href as never} className="text-primary text-sm hover:underline">
                        View all
                    </Link>
                )}
            </div>
            <ul className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
                {items.map((item) => (
                    <li key={`${mediaType}-${item.id}`} className="w-32 shrink-0 snap-start sm:w-36 md:w-40">
                        <MediaCard item={item} mediaType={mediaType} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
