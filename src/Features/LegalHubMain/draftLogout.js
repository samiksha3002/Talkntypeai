import { clearDraftRecovery } from './draftRecovery.js';
import { draftRequest, storeDraftSession } from './draftClient.js';
export function logoutDraftSession() {
  // Start revocation with the current token, then clear it locally immediately.
  const request = draftRequest('/user-drafts/logout', { method: 'POST' });
  clearDraftRecovery();
  storeDraftSession(null);
  return request.catch(() => {});
}
