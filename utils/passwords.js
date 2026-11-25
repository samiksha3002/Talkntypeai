// Password handling (merged: main's hash-only schema + security/critical-fixes upgrade path).
//
// Schema (models/user.js):
//   passwordHash  bcrypt, cost 12, the only form written for new/changed passwords
//   password      legacy plain text from before hashing; accepted at login,
//                 never written by new code
// LEGACY_PASSWORD_UPGRADE (default "on"): after a successful legacy login, the plain
// text is moved to passwordHash and removed. "off" keeps legacy records read-only
// (main's behaviour) so a rollback to code that compares plain text stays possible.
import bcrypt from 'bcryptjs';
import { createHash, timingSafeEqual } from 'node:crypto';

export const BCRYPT_COST = 12;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_BYTES = 72;   // bcrypt ignores anything longer: refuse instead of truncating
const HASH = /^\$2[aby]\$12\$[./A-Za-z0-9]{53}$/;
export const isBcryptHash = value => typeof value === 'string' && HASH.test(value);
const digest = s => createHash('sha256').update(s).digest();

export async function hashNewPassword(password) {
  if (typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) throw new Error('Password must contain 1 to 72 UTF-8 bytes.');
  return bcrypt.hash(password, BCRYPT_COST);
}

// { ok, needsUpgrade } for a user record ({ passwordHash } or legacy { password }).
// A present-but-invalid passwordHash never falls back to the legacy field.
export async function checkPassword(record, password) {
  if (typeof password !== 'string' || !password) return { ok: false, needsUpgrade: false };
  if (record?.passwordHash !== undefined && record.passwordHash !== null) {
    if (!isBcryptHash(record.passwordHash) || Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) return { ok: false, needsUpgrade: false };
    return { ok: await bcrypt.compare(password, record.passwordHash), needsUpgrade: false };
  }
  const ok = typeof record?.password === 'string' && timingSafeEqual(digest(password), digest(record.password));
  // Legacy passwords longer than 72 bytes cannot be hashed without truncation; they stay legacy.
  return { ok, needsUpgrade: ok && Buffer.byteLength(password, 'utf8') <= MAX_PASSWORD_BYTES };
}

export async function verifyPassword(record, password) {
  return (await checkPassword(record, password)).ok;
}

export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) return `Password must be at most ${MAX_PASSWORD_BYTES} bytes.`;
  return null;
}

export function legacyUpgradeEnabled(env = process.env) {
  const value = String(env.LEGACY_PASSWORD_UPGRADE ?? 'on').trim().toLowerCase();
  return !['off', 'false', '0', 'no'].includes(value);
}

// Moves a verified legacy plain-text password into passwordHash and removes it.
// Compare-and-set: only if the stored plain text is unchanged and no hash exists yet.
// Returns true if an upgrade was attempted.
export async function upgradeLegacyPassword(users, record, password, { env = process.env } = {}) {
  if (!legacyUpgradeEnabled(env)) return false;
  try {
    await users.updateOne({ _id: record._id, password: record.password, passwordHash: { $exists: false } },
      { $set: { passwordHash: await hashNewPassword(password) }, $unset: { password: '' } });
  } catch (error) { console.error('[auth] password upgrade failed:', error?.message); }
  return true;
}

// Loads a user including both (normally hidden) password fields.
export async function findWithPassword(users, filter) {
  const query = users.findOne(filter);
  return typeof query?.select === 'function' ? query.select('+password +passwordHash') : query;
}
