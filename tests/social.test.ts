import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
    countFollowers,
    countFollowing,
    getFollowers,
    getFollowing,
    isFollowing,
    toggleFollow,
} from '@/server/services/follows';
import {
    addItemToList,
    createList,
    getListBySlug,
    getListItems,
    getPublicLists,
    getUserLists,
    isListLiked,
    removeItemFromList,
    toggleListLike,
} from '@/server/services/lists';
import { getNotifications, getUnreadNotificationCount } from '@/server/services/notifications';
import {
    countUserReviews,
    deleteReview,
    getMediaRatingSummary,
    getReviewsForMedia,
    getUserReview,
    upsertReview,
} from '@/server/services/reviews';
import { closeDatabase, createTestUser, resetDatabase, seedGamificationData } from './helpers/db';

beforeAll(async () => {
    await resetDatabase();
    await seedGamificationData();
});

afterAll(async () => {
    await closeDatabase();
});

let alice: number;
let bob: number;

beforeEach(async () => {
    alice = await createTestUser();
    bob = await createTestUser();
});

describe('follows', () => {
    it('follows and unfollows, keeping counts in sync', async () => {
        const followed = await toggleFollow(alice, bob);
        expect(followed).toEqual({ following: true });
        expect(await isFollowing(alice, bob)).toBe(true);
        expect(await countFollowers(bob)).toBe(1);
        expect(await countFollowing(alice)).toBe(1);

        const unfollowed = await toggleFollow(alice, bob);
        expect(unfollowed).toEqual({ following: false });
        expect(await isFollowing(alice, bob)).toBe(false);
        expect(await countFollowers(bob)).toBe(0);
    });

    it('will not let a user follow themselves', async () => {
        expect(await toggleFollow(alice, alice)).toEqual({ following: false });
        expect(await countFollowing(alice)).toBe(0);
    });

    it('lists followers and following with user summaries', async () => {
        await toggleFollow(alice, bob);

        const followers = await getFollowers(bob);
        expect(followers.map((row) => row.id)).toContain(alice);

        const following = await getFollowing(alice);
        expect(following.map((row) => row.id)).toContain(bob);
    });

    it('notifies the followed user', async () => {
        await toggleFollow(alice, bob);

        expect(await getUnreadNotificationCount(bob)).toBe(1);
        const notifications = await getNotifications(bob);
        expect(notifications[0]?.type).toBe('followed');
    });
});

describe('reviews', () => {
    it('creates, updates, and soft-deletes a review', async () => {
        const created = await upsertReview({ userId: alice, tmdbId: 603, mediaType: 'movie', rating: 9, title: 'Great', content: 'Loved it' });
        expect(created).toEqual({ created: true });

        const own = await getUserReview(alice, 603, 'movie');
        expect(own).toMatchObject({ rating: 9, title: 'Great' });

        const updated = await upsertReview({ userId: alice, tmdbId: 603, mediaType: 'movie', rating: 6 });
        expect(updated).toEqual({ created: false });

        const afterUpdate = await getUserReview(alice, 603, 'movie');
        expect(afterUpdate).toMatchObject({ rating: 6, isEdited: true });

        await deleteReview(alice, afterUpdate!.id);
        expect(await getUserReview(alice, 603, 'movie')).toBeNull();
        expect(await countUserReviews(alice)).toBe(0);
    });

    it('exposes reviews for a title with author details and a rating summary', async () => {
        await upsertReview({ userId: alice, tmdbId: 603, mediaType: 'movie', rating: 8 });
        await upsertReview({ userId: bob, tmdbId: 603, mediaType: 'movie', rating: 6 });

        const reviews = await getReviewsForMedia(603, 'movie');
        expect(reviews).toHaveLength(2);
        expect(reviews[0]?.authorUsername).toBeTruthy();

        const summary = await getMediaRatingSummary(603, 'movie');
        expect(summary.count).toBe(2);
        expect(summary.average).toBeCloseTo(7, 5);
    });
});

describe('lists', () => {
    it('creates a list with a unique slug and lists it for the owner', async () => {
        const list = await createList(alice, { name: 'Cozy Watches', description: 'Comfort films' });
        expect(list.slug).toBe('cozy-watches');

        const mine = await getUserLists(alice);
        expect(mine.map((row) => row.id)).toContain(list.id);

        const duplicate = await createList(alice, { name: 'Cozy Watches' });
        expect(duplicate.slug).toBe('cozy-watches-2');
    });

    it('adds and removes items while maintaining the count, and rejects non-owners', async () => {
        const list = await createList(alice, { name: 'Weekend' });

        expect(await addItemToList(alice, list.id, { tmdbId: 550, mediaType: 'movie', title: 'Fight Club' })).toEqual({ added: true });
        expect(await addItemToList(alice, list.id, { tmdbId: 550, mediaType: 'movie' })).toEqual({ added: false });
        expect(await addItemToList(bob, list.id, { tmdbId: 680, mediaType: 'movie' })).toEqual({ added: false });

        const items = await getListItems(list.id);
        expect(items).toHaveLength(1);

        const [fromSlug] = [await getListBySlug(list.slug)];
        expect(fromSlug?.itemsCount).toBe(1);

        await removeItemFromList(alice, list.id, items[0]!.id);
        expect(await getListItems(list.id)).toHaveLength(0);
    });

    it('likes and unlikes a list', async () => {
        const list = await createList(alice, { name: 'Bob loves this' });

        expect(await toggleListLike(bob, list.id)).toEqual({ liked: true });
        expect(await isListLiked(bob, list.id)).toBe(true);
        expect((await getListBySlug(list.slug))?.likesCount).toBe(1);

        expect(await toggleListLike(bob, list.id)).toEqual({ liked: false });
        expect((await getListBySlug(list.slug))?.likesCount).toBe(0);
    });

    it('only surfaces public lists in discovery', async () => {
        await createList(alice, { name: 'Public list', visibility: 'public' });
        await createList(alice, { name: 'Secret list', visibility: 'private' });

        const publicLists = await getPublicLists();
        const names = publicLists.map((row) => row.name);
        expect(names).toContain('Public list');
        expect(names).not.toContain('Secret list');
    });
});
