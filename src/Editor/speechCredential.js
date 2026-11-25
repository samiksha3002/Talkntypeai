import { apiBase } from '../apiAuth.js';

// Release containment (main): Deepgram stays off until deliberately re-enabled in code;
// never enabled by a browser environment variable. To re-enable after verification:
// set this to true AND remove /api/deepgram from RELEASE_CONTAINMENT on the server.
export const DEEPGRAM_ENABLED = false;

// Browser code never receives the provider key. When enabled, the credential is a
// short-lived Deepgram access token issued for the signed-in user by
// POST /api/deepgram/token (security/critical-fixes); the session JWT is attached
// by src/apiAuth.js.
export async function getSpeechCredential({ enabled = DEEPGRAM_ENABLED, fetcher = (...args) => fetch(...args) } = {}) {
  if (!enabled) throw new Error('Deepgram dictation is temporarily unavailable for security maintenance. Browser speech remains available in supported languages.');
  const response = await fetcher(apiBase() + '/api/deepgram/token', { method: 'POST', cache: 'no-store' });
  if (response.status === 401) throw new Error('Please sign in again to use live dictation.');
  if (response.status === 403) throw new Error('Live dictation needs an active subscription.');
  if (response.status === 429) throw new Error('Too many dictation starts. Please wait a minute.');
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.accessToken !== 'string' || !data.accessToken) throw new Error(data.error || 'Live dictation is unavailable right now.');
  return { accessToken: data.accessToken };
}
