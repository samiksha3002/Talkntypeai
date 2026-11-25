// Password hashing with bcrypt (cost 12).
import bcrypt from 'bcryptjs';
import { createHash, timingSafeEqual } from 'node:crypto';

export const BCRYPT_COST = 12;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt only uses the first 72 bytes
export const isBcryptHash = value => typeof value === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);

export const hashPassword = password => bcrypt.hash(password, BCRYPT_COST);

/**
 * Checks a password against the stored value.
 * Legacy plain-text values (accounts not yet migrated by
 * scripts/hash-existing-passwords.mjs) are compared in constant time and
 * reported with needsUpgrade so the caller can replace them with a hash.
 */
export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string' || !stored) return { ok: false, needsUpgrade: false };
  if (isBcryptHash(stored)) return { ok: await bcrypt.compare(password, stored), needsUpgrade: false };
  const digest = value => createHash('sha256').update(value).digest();
  const ok = timingSafeEqual(digest(password), digest(stored));
  return { ok, needsUpgrade: ok };
}

export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (Buffer.byteLength(password) > MAX_PASSWORD_LENGTH) return `Password must be at most ${MAX_PASSWORD_LENGTH} bytes.`;
  return null;
}

// Loads a user including the password field (which the schema hides by default).
export async function findWithPassword(users, filter) {
  const query = users.findOne(filter);
  return typeof query?.select === 'function' ? query.select('+password') : query;
}

// LEGACY_PASSWORD_UPGRADE (default "on"). Set it to "off" during the first days
// after deploying so a rollback to the old code (which compares plain text) stays
// possible: legacy plain-text passwords are then still ACCEPTED at login but NOT
// rewritten. Do not run scripts/hash-existing-passwords.mjs while it is "off".
export function legacyUpgradeEnabled(env = process.env) {
  const value = String(env.LEGACY_PASSWORD_UPGRADE ?? 'on').trim().toLowerCase();
  return !['off', 'false', '0', 'no'].includes(value);
}

// Replaces a verified legacy plain-text password with a bcrypt hash.
// Compare-and-set: only updates if the stored value is still the old plain text.
// Returns true if an upgrade was attempted.
export async function upgradeLegacyPassword(users, user, password, { env = process.env } = {}) {
  if (!legacyUpgradeEnabled(env)) return false;
  try { await users.updateOne({ _id: user._id, password: user.password }, { $set: { password: await hashPassword(password) } }); }
  catch (error) { console.error('[auth] password upgrade failed:', error?.message); }
  return true;
}
