import { getNodeApi } from '../../nodeApi.js';
import { readDraftSession, resolveDraftApi } from '../../Features/LegalHubMain/draftClient.js';

export function createBookmarkClient({ base, token = readDraftSession, fetcher = (...args) => fetch(...args) } = {}) {
  return async (path = '', { method = 'GET', body, signal } = {}) => {
    const api = resolveDraftApi(base);
    const session = token();
    if (!session) throw Object.assign(new Error('Sign in again to securely access your bookmarks.'), { status: 401 });
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    const timeout = setTimeout(abort, 20000);
    try {
      const response = await fetcher(api + '/saved' + path, {
        method, cache: 'no-store', redirect: 'error', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await response.json();
      if (token() !== session) throw new Error('Your session changed. Reload your bookmarks.');
      if (!response.ok) throw Object.assign(new Error(data?.error || 'Bookmark request failed.'), { status: response.status });
      return data;
    } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
  };
}
export const bookmarkRequest = async (...args) => {
  const session = readDraftSession(), base = await getNodeApi();
  if (readDraftSession() !== session) throw new Error('Your session changed. Reload your bookmarks.');
  return createBookmarkClient({ base, token: () => {
    if (readDraftSession() !== session) throw new Error('Your session changed. Reload your bookmarks.');
    return session;
  } })(...args);
};
