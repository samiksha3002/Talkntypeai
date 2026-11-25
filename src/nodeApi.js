// One Node API target for login, secure workflows and editor operations.
export function normalizeNodeApi(base, origin = globalThis.location?.origin) {
  if (!base) throw new Error('Configure the Node API URL before using this service.');
  let url;
  try { url = new URL(base === '/api' ? base : base.trim(), base === '/api' ? origin : undefined); }
  catch { throw new Error('Invalid Node API configuration. Use an HTTPS origin or origin/api.'); }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('Node API requires HTTPS (except local development).');
  if (url.username || url.password || url.search || url.hash || !['', '/', '/api', '/api/'].includes(url.pathname)) throw new Error('Invalid Node API configuration. Use an origin or origin/api without credentials.');
  return url.origin + '/api';
}
export function createNodeApiResolver({ env = {}, origin, fetcher = (...args) => fetch(...args) } = {}) {
  let runtime;
  return async () => {
    const explicit = env.VITE_DRAFT_API_URL || env.VITE_API_URL;
    if (explicit) return normalizeNodeApi(explicit, origin);
    // Runtime config is a fallback, never an override of an explicit build setting.
    if (!runtime) runtime = (async () => {
      let config;
      try {
        const response = await fetcher('/config.json', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
        if (response.ok) config = await response.json();
      } catch { /* A missing legacy config uses the reviewed same-origin /api rewrite. */ }
      return normalizeNodeApi(config?.API_URL || '/api', origin);
    })();
    try { return await runtime; } catch (error) { runtime = null; throw error; }
  };
}
export const getNodeApi = createNodeApiResolver({ env: { VITE_DRAFT_API_URL: import.meta.env?.VITE_DRAFT_API_URL, VITE_API_URL: import.meta.env?.VITE_API_URL }, origin: globalThis.location?.origin });
export const getNodeOrigin = async () => (await getNodeApi()).replace(/\/api$/, '');
