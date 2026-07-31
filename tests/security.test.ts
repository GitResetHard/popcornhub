import { describe, expect, it } from 'vitest';
import { generateRecoveryCodes, generateTotpSecret, hashPassword, sign, unsign, verifyPassword } from '@/lib/security';
import { decodeClipId, encodeClipId } from '@/lib/ids';
import { isReservedUsername } from '@/lib/validation/reserved-usernames';

describe('password hashing', () => {
    it('hashes with scrypt and verifies round trips', () => {
        const hash = hashPassword('correct horse battery staple');

        expect(hash.startsWith('scrypt:')).toBe(true);
        expect(verifyPassword('correct horse battery staple', hash)).toBe(true);
        expect(verifyPassword('wrong', hash)).toBe(false);
    });

    it('produces a different hash each time because the salt is random', () => {
        expect(hashPassword('same')).not.toBe(hashPassword('same'));
    });

    it('rejects malformed or missing hashes without throwing', () => {
        expect(verifyPassword('anything', null)).toBe(false);
        expect(verifyPassword('anything', '')).toBe(false);
        expect(verifyPassword('anything', 'not-a-hash')).toBe(false);
        expect(verifyPassword('anything', 'scrypt:onlyone')).toBe(false);
    });
});

describe('cookie signing', () => {
    it('round-trips a signed value', () => {
        const signed = sign('payload.123');

        expect(unsign(signed)).toBe('payload.123');
    });

    it('rejects a tampered value', () => {
        const signed = sign('payload.123');

        expect(unsign(`${signed}x`)).toBeNull();
        expect(unsign('payload.999.' + signed.split('.').pop())).toBeNull();
    });

    it('rejects values with no signature', () => {
        expect(unsign('unsigned-value')).toBeNull();
    });
});

describe('totp secrets', () => {
    it('generates base32 secrets', () => {
        expect(generateTotpSecret()).toMatch(/^[A-Z2-7]{32}$/);
    });

    it('generates unique recovery codes', () => {
        const codes = generateRecoveryCodes(8);

        expect(codes).toHaveLength(8);
        expect(new Set(codes).size).toBe(8);
    });
});

describe('clip ids', () => {
    it('encodes ids to at least six lowercase alphanumeric characters', () => {
        for (const id of [1, 42, 9999, 2_147_483_647]) {
            const hash = encodeClipId(id);

            expect(hash).toMatch(/^[a-z0-9]{6,}$/);
            expect(decodeClipId(hash)).toBe(id);
        }
    });

    it('returns null for hashes that do not decode', () => {
        expect(decodeClipId('!!!!!!')).toBeNull();
        expect(decodeClipId('')).toBeNull();
    });
});

describe('reserved usernames', () => {
    it('blocks reserved names case-insensitively', () => {
        expect(isReservedUsername('admin')).toBe(true);
        expect(isReservedUsername('ADMIN')).toBe(true);
        expect(isReservedUsername('watchlist')).toBe(true);
    });

    it('allows ordinary names', () => {
        expect(isReservedUsername('cinephile99')).toBe(false);
    });
});
