// Attaches the signed-in user's JWT to requests for our own Node API only.
// The server verifies every request; this module just carries the token so the
// many existing fetch/axios call sites keep working without individual changes.
// Tokens are never sent to other hosts (Deepgram, Google, the Python service, …).
import axios from 'axios';
import { getDraftSession } from './Features/LegalHubMain/draftClient.js';

const env = typeof import.meta !== 'undefined' ? (import.meta.env || {}) : {};
export const PRODUCTION_API_ORIGIN = 'https://talkntypeai.onrender.com';
export const DEV_API_ORIGINS = ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:10000'];

// Origins that receive the session token. Loopback origins are trusted only in the
// Vite dev server (import.meta.env.DEV), never in a production build.
export function apiOrigins({ dev = Boolean(env.DEV), vars = env } = {}) {
  return [PRODUCTION_API_ORIGIN, vars.VITE_API_URL, vars.VITE_DRAFT_API_URL, ...(dev ? DEV_API_ORIGINS : [])];
}
export const API_ORIGINS = apiOrigins();

// Base URL of our Node API. Production builds always have VITE_API_URL
// (vite.config.js refuses to build without it); loopback is a dev-only default.
export function apiBase({ dev = Boolean(env.DEV), vars = env } = {}) {
  if (vars.VITE_API_URL) return String(vars.VITE_API_URL).replace(/\/$/, '').replace(/\/api$/, '');
  return dev ? DEV_API_ORIGINS[0] : PRODUCTION_API_ORIGIN;
}

// AI endpoints served by the Python service are reached only through our Node API
// proxy (/api/brain/*), which authenticates the user and adds the service secret.
const BRAIN_PATHS = new Set(['/api/generate-legal-draft', '/api/generate-legal-draft-stream', '/api/ai-command',
  '/api/chat-with-pdf', '/api/analyze-document', '/api/legal-research', '/api/translate-research-marathi']);
export function aiServiceUrl(endpoint) {
  return BRAIN_PATHS.has(endpoint) ? apiBase() + '/api/brain/' + endpoint.slice('/api/'.length) : apiBase() + endpoint;
}

function originOf(value) { try { return new URL(value).origin; } catch { return null; } }

// Relative URLs are resolved against the page, but the page's own origin is NOT
// trusted: a same-origin /api request would leave through the hosting rewrite to
// whatever host vercel.json names, so it never gets the token implicitly.
export function isOwnApi(url, { origins = API_ORIGINS, pageOrigin = globalThis.location?.origin } = {}) {
  let target;
  try { target = new URL(String(url), pageOrigin || 'http://invalid.local'); } catch { return false; }
  if (!target.pathname.startsWith('/api/')) return false;
  return new Set(origins.map(originOf).filter(Boolean)).has(target.origin);
}

export function installApiAuth({ token = getDraftSession, target = globalThis, http = axios } = {}) {
  if (target.__tntApiAuthInstalled) return;
  target.__tntApiAuthInstalled = true;
  const originalFetch = target.fetch.bind(target);
  target.fetch = (input, init = {}) => {
    const url = typeof input === 'string' || input instanceof URL ? input : input?.url;
    const jwt = isOwnApi(url) ? token() : null;
    if (!jwt) return originalFetch(input, init);
    const headers = new Headers(init.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + jwt);
    return originalFetch(input, { ...init, headers });
  };
  attachAxiosAuth(http, { token });
}

export function attachAxiosAuth(instance, { token = getDraftSession } = {}) {
  instance.interceptors.request.use(config => {
    const url = config.baseURL && !/^https?:/i.test(config.url || '') ? config.baseURL.replace(/\/$/, '') + '/' + String(config.url || '').replace(/^\//, '') : config.url;
    const jwt = isOwnApi(url) ? token() : null;
    if (jwt) {
      config.headers = config.headers || {};
      if (typeof config.headers.set === 'function') { if (!config.headers.has?.('Authorization')) config.headers.set('Authorization', 'Bearer ' + jwt); }
      else if (!config.headers.Authorization) config.headers.Authorization = 'Bearer ' + jwt;
    }
    return config;
  });
  return instance;
}
