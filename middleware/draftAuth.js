import { randomBytes, createHash } from 'node:crypto';
import DraftSession from '../models/DraftSession.js';
import User from '../models/user.js';
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
export async function issueDraftSession(ownerId) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  await DraftSession.create({ ownerId, tokenHash: tokenHash(token), expiresAt });
  return { token, expiresAt: expiresAt.toISOString() };
}
export function createDraftAuth({ sessions = DraftSession, users = User } = {}) {
  return async (req, res, next) => {
    const token = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '')?.[1];
    if (!token) return res.status(401).json({ success: false, error: 'Sign in again to access your drafts.' });
    try {
      const session = await sessions.findOne({ tokenHash: tokenHash(token), expiresAt: { $gt: new Date() } });
      if (!session) return res.status(401).json({ success: false, error: 'Draft session expired. Sign in again.' });
      const user = await users.findById(session.ownerId);
      if (!user || (user.role !== 'admin' && (!user.subscription?.isActive ||
        (user.subscription.expiryDate && new Date(user.subscription.expiryDate) <= new Date())))) {
        return res.status(403).json({ success: false, error: 'Your account does not currently have draft access.' });
      }
      req.draftOwnerId = user._id;
      req.draftRole = user.role;
      req.draftTokenHash = session.tokenHash;
      next();
    } catch {
      res.status(503).json({ success: false, error: 'Draft authentication is temporarily unavailable.' });
    }
  };
}
export const requireDraftAuth = createDraftAuth();
