import { MessageSquareText } from 'lucide-react';
import { EmptyState } from '@/components/layout/empty-state';
import { SectionHeader } from '@/components/layout/section-header';
import { UserAvatar } from '@/components/layout/user-avatar';
import { StarDisplay } from '@/components/media/star-rating';
import { Badge } from '@/components/ui/badge';
import { internalHref } from '@/lib/routes';
import Link from 'next/link';
import { getReviewsForMedia, type ReviewView } from '@/server/services/reviews';
import { getCurrentUser } from '@/server/auth/current-user';
import { ReviewComposer } from './review-composer';
import { DeleteReviewButton } from './delete-review-button';

function ReviewItem({ review, canDelete, tmdbId, mediaType }: { review: ReviewView; canDelete: boolean; tmdbId: number; mediaType: 'movie' | 'tv' }) {
    return (
        <article className="bg-card rounded-xl border p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link href={internalHref(`/users/${review.authorUsername}`)}>
                        <UserAvatar name={review.authorName} avatar={review.authorAvatar} className="size-9" />
                    </Link>
                    <div>
                        <Link href={internalHref(`/users/${review.authorUsername}`)} className="text-sm font-semibold hover:underline">
                            {review.authorName}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2">
                            <StarDisplay rating={review.rating} />
                            <span className="text-muted-foreground text-xs">{review.rating}/10</span>
                            {review.isEdited && <span className="text-muted-foreground text-xs">· edited</span>}
                        </div>
                    </div>
                </div>
                {canDelete && <DeleteReviewButton reviewId={review.id} tmdbId={tmdbId} mediaType={mediaType} />}
            </div>

            {review.title && <h4 className="mt-3 font-semibold">{review.title}</h4>}
            {review.hasSpoilers && (
                <Badge variant="warning" className="mt-2">
                    Spoilers
                </Badge>
            )}
            {review.content && <p className="text-muted-foreground mt-2 text-sm whitespace-pre-line">{review.content}</p>}
        </article>
    );
}

export async function ReviewSection({ tmdbId, mediaType }: { tmdbId: number; mediaType: 'movie' | 'tv' }) {
    const user = await getCurrentUser();
    const reviews = await getReviewsForMedia(tmdbId, mediaType);

    const ownReview = user ? (reviews.find((review) => review.userId === user.id) ?? null) : null;
    const others = reviews.filter((review) => review.userId !== user?.id);

    return (
        <section className="space-y-4">
            <SectionHeader title="Reviews" description={`${reviews.length} member ${reviews.length === 1 ? 'review' : 'reviews'}`} />

            {user?.email_verified_at ? (
                <ReviewComposer
                    tmdbId={tmdbId}
                    mediaType={mediaType}
                    existing={
                        ownReview
                            ? { rating: ownReview.rating, title: ownReview.title, content: ownReview.content, hasSpoilers: ownReview.hasSpoilers }
                            : null
                    }
                />
            ) : (
                <p className="text-muted-foreground text-sm">
                    {user ? 'Verify your email to write a review.' : 'Sign in to rate and review this title.'}
                </p>
            )}

            {reviews.length === 0 ? (
                <EmptyState icon={MessageSquareText} title="No reviews yet" description="Be the first to share your thoughts." />
            ) : (
                <div className="space-y-3">
                    {ownReview && <ReviewItem review={ownReview} canDelete tmdbId={tmdbId} mediaType={mediaType} />}
                    {others.map((review) => (
                        <ReviewItem key={review.id} review={review} canDelete={false} tmdbId={tmdbId} mediaType={mediaType} />
                    ))}
                </div>
            )}
        </section>
    );
}
