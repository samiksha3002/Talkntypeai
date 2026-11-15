import { clearDraftRecovery } from './draftRecovery.js';
import { createDraftClient, getDraftSession, storeDraftSession } from './draftClient.js';
import { getNodeApi } from '../../nodeApi.js';
export function logoutDraftSession() {
  // Capture before async API resolution; clear local access immediately.
  const token = getDraftSession();
  const request = token ? getNodeApi().then(base => createDraftClient({ base, token: () => token })('/user-drafts/logout', { method: 'POST' })) : Promise.resolve();
  clearDraftRecovery();
  storeDraftSession(null);
  return request.catch(() => {});
}
