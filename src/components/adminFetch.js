import { getNodeApi } from '../nodeApi.js';
import { readDraftSession } from '../Features/LegalHubMain/draftClient.js';
export async function adminFetch(path, options = {}) {
  const token = readDraftSession();
  const base = await getNodeApi();
  if (readDraftSession() !== token) throw new Error('Session changed. Sign in again.');
  if (!token) throw Object.assign(new Error('Sign in with a database administrator account.'), { auth: true });
  const response = await fetch(base + '/admin' + path, {...options, cache:'no-store', redirect:'error',
    headers:{...options.headers, Authorization:'Bearer ' + token}});
  if (readDraftSession() !== token) throw new Error('Session changed. Sign in again.');
  if (response.status === 401 || response.status === 403) throw Object.assign(new Error('Sign in again with a database administrator account.'), { auth: true, status: response.status });
  if (!response.ok) throw Object.assign(new Error('Administrator request failed (' + response.status + ').'), { status: response.status });
  return response;
}
