import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import * as OTPAuth from 'otpauth';
import { env } from './env';

/**
 * Authentication cryptography.
 *
 * Passwords are hashed with scrypt, a memory-hard KDF, so existing credentials from any
 * earlier system cannot be imported — a deliberate choice for a fresh project, since those
 * hashes used a different (and weaker) construction. Sessions and OAuth state are signed with
 * HMAC over AUTH_SECRET.
 */

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

export function hashPassword(plain: string): string {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(plain, salt, KEY_LENGTH, SCRYPT_PARAMS).toString('hex');

    return `scrypt:${SCRYPT_PARAMS.N}:${salt}:${derived}`;
}

export function verifyPassword(plain: string, stored: string | null | undefined): boolean {
    if (!stored || !stored.startsWith('scrypt:')) {
        return false;
    }

    const [, n, salt, expected] = stored.split(':');

    if (!n || !salt || !expected) {
        return false;
    }

    const derived = scryptSync(plain, salt, KEY_LENGTH, { ...SCRYPT_PARAMS, N: Number(n) });
    const expectedBuffer = Buffer.from(expected, 'hex');

    return derived.length === expectedBuffer.length && timingSafeEqual(derived, expectedBuffer);
}

export function randomToken(bytes = 32): string {
    return randomBytes(bytes).toString('hex');
}

/** Signs a value so a cookie can be trusted without a server round trip. */
export function sign(value: string): string {
    return `${value}.${hmac(value)}`;
}

/** Verifies a signed value, returning the unsigned payload or null when tampered with. */
export function unsign(signed: string): string | null {
    const lastDot = signed.lastIndexOf('.');

    if (lastDot === -1) {
        return null;
    }

    const value = signed.slice(0, lastDot);
    const signature = signed.slice(lastDot + 1);
    const expected = hmac(value);

    const left = Buffer.from(signature, 'utf8');
    const right = Buffer.from(expected, 'utf8');

    return left.length === right.length && timingSafeEqual(left, right) ? value : null;
}

function hmac(value: string): string {
    return createHmac('sha256', env.AUTH_SECRET).update(value).digest('hex');
}

/* ---------------------------------- TOTP ---------------------------------- */

const TOTP_CONFIG = { algorithm: 'SHA1', digits: 6, period: 30, window: 1 } as const;

export function generateTotpSecret(): string {
    return new OTPAuth.Secret({ size: 20 }).base32;
}

export function verifyTotpCode(secret: string, code: string): boolean {
    const totp = new OTPAuth.TOTP({
        issuer: env.APP_NAME,
        algorithm: TOTP_CONFIG.algorithm,
        digits: TOTP_CONFIG.digits,
        period: TOTP_CONFIG.period,
        secret: OTPAuth.Secret.fromBase32(secret),
    });

    return totp.validate({ token: code.replace(/\s/g, ''), window: TOTP_CONFIG.window }) !== null;
}

export function generateRecoveryCodes(count = 8): string[] {
    return Array.from({ length: count }, () => randomBytes(5).toString('hex'));
}
