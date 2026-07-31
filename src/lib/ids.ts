import Sqids from 'sqids';

/** Clips are addressed by a short public hash rather than their numeric id. */
const sqids = new Sqids({
    alphabet: 'abcdefghijklmnopqrstuvwxyz0123456789',
    minLength: 6,
});

export function encodeClipId(id: number): string {
    return sqids.encode([id]);
}

export function decodeClipId(hash: string): number | null {
    const ids = sqids.decode(hash);

    return ids[0] ?? null;
}
