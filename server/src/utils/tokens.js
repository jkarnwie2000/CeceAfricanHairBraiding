import crypto from 'node:crypto';

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

/** Constant-time comparison of a raw token against a stored SHA-256 hash. */
export function tokenMatches(rawToken, storedHash) {
  if (!rawToken || !storedHash) return false;
  const a = Buffer.from(hashToken(rawToken), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion

/** Human-friendly reference codes, e.g. CECE-7K4M2Q */
export function shortCode(prefix, length = 6) {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `${prefix}-${out}`;
}
