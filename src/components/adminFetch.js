import { getNodeApi } from '../nodeApi.js';
import { readDraftSession } from '../Features/LegalHubMain/draftClient.js';
export async function adminFetch(path, options = {}) {
  const token = readDraftSession();
  const base = await getNodeApi();
  if (readDraftSession() !== token) throw new Error('Session changed. Sign in again.');
  if (!token) throw new Error('Sign in with a database administrator account.');
  const response = await fetch(base + '/admin' + path, {...options, cache:'no-store', redirect:'error',
    headers:{...options.headers, Authorization:'Bearer ' + token}});
  if (readDraftSession() !== token) throw new Error('Session changed. Sign in again.');
  if (!response.ok) throw new Error('Administrator request failed (' + response.status + ').');
  return response;
}
