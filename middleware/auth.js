// Server-side authentication for every protected API route.
//
// A login issues a short-lived HS256 JWT ({sub: userId, jti}). The jti is stored
// only as a SHA-256 hash in the sessions collection so a token can be revoked
// (logout) before it expires. Role and subscription are always re-read from the
// database on each request; nothing in the token or request body is trusted for
// authorization.
import { randomBytes, createHash } from 'node:crypto';
import DraftSession from '../models/DraftSession.js';
import User from '../models/user.js';
import { signJwt, verifyJwt } from '../utils/jwt.js';

export const SESSION_TTL_SECONDS = 12 * 60 * 60;
export const tokenHash = value => createHash('sha256').update(String(value)).digest('hex');
const OBJECT_ID = /^[a-f0-9]{24}$/i;
const JTI = /^[a-f0-9]{64}$/;

export async function issueSession(ownerId, { sessions = DraftSession, now = Date.now() } = {}) {
  const jti = randomBytes(32).toString('hex');
  const expiresAt = new Date(now + SESSION_TTL_SECONDS * 1000);
  const token = signJwt({ sub: String(ownerId), jti }, { expiresInSeconds: SESSION_TTL_SECONDS, now });
  await sessions.create({ ownerId, tokenHash: tokenHash(jti), expiresAt });
  return { token, expiresAt: expiresAt.toISOString() };
}

// Verified claims from "Authorization: Bearer <jwt>", or null.
export function bearerClaims(req, { allowExpired = false } = {}) {
  const token = /^Bearer (\S+)$/.exec(req.headers?.authorization || '')?.[1];
  const claims = token ? verifyJwt(token, { allowExpired }) : null;
  if (!claims || !OBJECT_ID.test(String(claims.sub)) || !JTI.test(String(claims.jti))) return null;
  return claims;
}

export function hasActiveSubscription(user, now = new Date()) {
  if (user?.role === 'admin') return true;
  const sub = user?.subscription;
  return Boolean(sub?.isActive) && !(sub.expiryDate && new Date(sub.expiryDate) <= now);
}

// Only fields that are safe to send to a browser.
export function publicUser(user) {
  if (!user) return null;
  return { _id: String(user._id), fullName: user.fullName, email: user.email, role: user.role,
    subscription: user.subscription ? { plan: user.subscription.plan, isActive: user.subscription.isActive,
      startDate: user.subscription.startDate, expiryDate: user.subscription.expiryDate } : undefined };
}

const DEFAULT_MESSAGES = {
  missing: 'Sign in to continue.',
  expired: 'Your session has expired. Sign in again.',
  forbidden: 'Your account does not have an active subscription.',
  admin: 'Administrator access is required.',
  unavailable: 'Authentication is temporarily unavailable.',
};

let configWarned = false;
/**
 * access: 'user'         any signed-in account (even without a subscription)
 *         'subscription' active, unexpired subscription (admins always pass)
 *         'admin'        role === 'admin' in the database
 */
export function createAuth({ sessions = DraftSession, users = User, access = 'subscription', messages = {} } = {}) {
  const text = { ...DEFAULT_MESSAGES, ...messages };
  return async (req, res, next) => {
    let claims;
    try { claims = bearerClaims(req); }
    catch (error) {
      if (error.configuration && !configWarned) { configWarned = true; console.error('[auth] JWT_SECRET is not configured; all protected routes will refuse requests.'); }
      return res.status(503).json({ success: false, error: text.unavailable });
    }
    if (!claims) return res.status(401).json({ success: false, error: req.headers?.authorization ? text.expired : text.missing });
    try {
      const session = await sessions.findOne({ tokenHash: tokenHash(claims.jti), expiresAt: { $gt: new Date() } });
      if (!session || String(session.ownerId) !== String(claims.sub)) return res.status(401).json({ success: false, error: text.expired });
      const user = await users.findById(claims.sub);
      if (!user) return res.status(401).json({ success: false, error: text.expired });
      if (access === 'admin' && user.role !== 'admin') return res.status(403).json({ success: false, error: text.admin });
      if (access === 'subscription' && !hasActiveSubscription(user)) return res.status(403).json({ success: false, error: text.forbidden });
      req.user = { ...publicUser(user), id: String(user._id) };
      // Names used by the drafts, bookmarks, tenant and admin routers (from main).
      req.draftOwnerId = user._id;
      req.draftRole = user.role;
      req.draftTokenHash = session.tokenHash;
      next();
    } catch {
      res.status(503).json({ success: false, error: text.unavailable });
    }
  };
}

export const requireUser = createAuth({ access: 'user' });
export const requireSubscription = createAuth({ access: 'subscription' });
export const requireAdmin = createAuth({ access: 'admin' });
