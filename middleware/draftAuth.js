// Drafts and bookmarks use the shared JWT authentication (middleware/auth.js)
// with draft-specific messages. Kept as a module so existing imports keep working.
import DraftSession from '../models/DraftSession.js';
import User from '../models/user.js';
import { createAuth, issueSession, tokenHash } from './auth.js';

export { tokenHash };
export const issueDraftSession = ownerId => issueSession(ownerId);
export function createDraftAuth({ sessions = DraftSession, users = User } = {}) {
  return createAuth({ sessions, users, access: 'subscription', messages: {
    missing: 'Sign in again to access your drafts.',
    expired: 'Draft session expired. Sign in again.',
    forbidden: 'Your account does not currently have draft access.',
    unavailable: 'Draft authentication is temporarily unavailable.',
  } });
}
export const requireDraftAuth = createDraftAuth();
