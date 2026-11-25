import express from 'express';

// Live dictation (Deepgram) without exposing the real API key.
//
// POST /api/deepgram/token  (JWT + active subscription, enforced by the API guard)
//   -> { accessToken, expiresIn }
// The browser opens the Deepgram websocket with this short-lived token. The
// long-lived DEEPGRAM_API_KEY stays on the server and is never sent to clients.
// The old GET /api/deepgram (which returned the key itself) no longer exists.

const GRANT_URL = 'https://api.deepgram.com/v1/auth/grant';

export function tokenTtlSeconds(env = process.env) {
  const value = Number(env.DEEPGRAM_TOKEN_TTL_SECONDS ?? 60);
  return Number.isFinite(value) ? Math.min(600, Math.max(30, Math.round(value))) : 60;
}

export async function deepgramGrant({ apiKey = process.env.DEEPGRAM_API_KEY, ttlSeconds = tokenTtlSeconds(), fetcher = fetch, signal } = {}) {
  if (!apiKey) throw Object.assign(new Error('DEEPGRAM_API_KEY is not configured.'), { configuration: true });
  const response = await fetcher(GRANT_URL, { method: 'POST', signal,
    headers: { Authorization: 'Token ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl_seconds: ttlSeconds }) });
  if (!response.ok) throw new Error('Deepgram grant failed with status ' + response.status);
  const data = await response.json();
  if (typeof data?.access_token !== 'string' || !data.access_token) throw new Error('Deepgram grant returned no token.');
  return { accessToken: data.access_token, expiresIn: Number(data.expires_in) || ttlSeconds };
}

export function createDeepgramRouter({ grant = deepgramGrant } = {}) {
  const router = express.Router();
  router.post('/token', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const { accessToken, expiresIn } = await grant({ signal: AbortSignal.timeout(10000) });
      res.json({ accessToken, expiresIn });
    } catch (error) {
      if (error?.configuration) {
        console.error('[deepgram] DEEPGRAM_API_KEY is not configured.');
        return res.status(503).json({ error: 'Live dictation is not configured.' });
      }
      console.error('[deepgram] token grant failed:', error?.message);
      res.status(502).json({ error: 'Live dictation is temporarily unavailable. Try again shortly.' });
    }
  });
  return router;
}

export default createDeepgramRouter();
