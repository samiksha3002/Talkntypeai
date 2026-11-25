// Default-deny guard for every /api route.
//
// - Public routes (login, registration, draft templates) are listed explicitly.
// - Routers that enforce their own auth (admin, user drafts, bookmarks) are skipped
//   so they are not authenticated twice.
// - Everything else requires a valid JWT and an active subscription, checked on
//   the server against the database (middleware/auth.js).
// - Rate limits: per IP (server.js apiLimiter + login limiter), per user for all
//   authenticated requests, and a stricter per-user limit on paid API groups.
import rateLimit from 'express-rate-limit';
import { setting } from '../utils/resourceProtection.js';
import { requireSubscription } from './auth.js';

const under = (path, prefix) => path === prefix || path.startsWith(prefix + '/');

export const PUBLIC_ROUTES = [
  ['POST', '/api/login'],
  ['POST', '/api/create-user'],
  ['POST', '/api/draft-session'],
  ['GET', /^\/api\/drafts\/[^/]+$/],   // draft templates (non-sensitive), incl. /api/drafts/all
];
export const SELF_PROTECTED = ['/api/admin', '/api/user-drafts', '/api/saved'];
// Endpoints that spend money on third-party APIs (OpenAI, Gemini, Deepgram, Indian Kanoon) or heavy OCR.
export const PAID_PREFIXES = ['/api/deepgram', '/api/audio', '/api/chat', '/api/chattranslate', '/api/transliterate',
  '/api/expand', '/api/fix-grammar', '/api/ocr', '/api/upload-pdf', '/api/generate-legal-draft', '/api/list-models',
  '/api/legal-ai', '/api/draft', '/api/judgements', '/api/judgement-ai', '/api/brain'];

export const isPublic = (method, path) => PUBLIC_ROUTES.some(([m, p]) => m === method && (p instanceof RegExp ? p.test(path) : p === path));
export const isSelfProtected = path => SELF_PROTECTED.some(prefix => under(path, prefix));
export const isPaid = path => PAID_PREFIXES.some(prefix => under(path, prefix));

const userKey = req => 'user:' + req.user.id;
export function createUserLimiters({ perMinute = setting('USER_REQUESTS_PER_MINUTE', 120), paidPerMinute = setting('USER_PAID_REQUESTS_PER_MINUTE', 30) } = {}) {
  const common = { windowMs: 60 * 1000, standardHeaders: true, legacyHeaders: false, keyGenerator: userKey };
  return {
    all: rateLimit({ ...common, limit: perMinute, message: { success: false, error: 'Too many requests from your account. Please slow down.' } }),
    paid: rateLimit({ ...common, limit: paidPerMinute, message: { success: false, error: 'Usage limit reached for this minute. Try again shortly.' } }),
  };
}

export function createApiGuard({ auth = requireSubscription, limiters = createUserLimiters() } = {}) {
  return (req, res, next) => {
    // Express matches routes case-insensitively, so classify on the lower-cased path.
    const path = ((req.baseUrl || '') + (req.path === '/' && req.baseUrl ? '' : req.path)).toLowerCase();
    if (req.method === 'OPTIONS' || isPublic(req.method, path) || isSelfProtected(path)) return next();
    auth(req, res, () => limiters.all(req, res, () => (isPaid(path) ? limiters.paid(req, res, next) : next())));
  };
}

// Brute-force protection for credential endpoints (per IP; successful logins are not counted).
export const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: setting('LOGIN_ATTEMPTS_PER_15_MIN', 10),
  standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: true,
  message: { message: 'Too many sign-in attempts. Try again in 15 minutes.' } });
export const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: setting('REGISTRATIONS_PER_HOUR', 5),
  standardHeaders: true, legacyHeaders: false, message: { message: 'Too many registrations from this network. Try again later.' } });
