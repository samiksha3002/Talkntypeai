// Minimal HS256 JSON Web Tokens using only node:crypto (no extra dependency).
// Only HS256 is accepted; the algorithm is never taken from the token header.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const JWT_ISSUER = 'talkntype-api';
export const JWT_AUDIENCE = 'talkntype-app';
export const JWT_PATTERN = /^[A-Za-z0-9_-]{10,200}\.[A-Za-z0-9_-]{10,1000}\.[A-Za-z0-9_-]{43}$/;
const HEADER = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

export function jwtSecret(env = process.env) {
  const secret = env.JWT_SECRET;
  if (typeof secret !== 'string' || secret.length < 32) throw Object.assign(new Error('JWT_SECRET must be set (at least 32 characters).'), { configuration: true });
  return secret;
}

const sign = (data, secret) => createHmac('sha256', secret).update(data).digest('base64url');

export function signJwt(claims, { secret = jwtSecret(), expiresInSeconds, now = Date.now() } = {}) {
  const iat = Math.floor(now / 1000);
  const payload = { ...claims, iss: JWT_ISSUER, aud: JWT_AUDIENCE, iat, exp: iat + expiresInSeconds };
  const body = HEADER + '.' + Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body + '.' + sign(body, secret);
}

// Returns the payload or null. Never throws on malformed input.
export function verifyJwt(token, { secret = jwtSecret(), now = Date.now(), allowExpired = false } = {}) {
  if (typeof token !== 'string' || !JWT_PATTERN.test(token)) return null;
  const [header, payload, signature] = token.split('.');
  const expected = Buffer.from(sign(header + '.' + payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  let head, claims;
  try { head = JSON.parse(Buffer.from(header, 'base64url').toString()); claims = JSON.parse(Buffer.from(payload, 'base64url').toString()); }
  catch { return null; }
  if (head?.alg !== 'HS256' || !claims || typeof claims !== 'object') return null;
  if (claims.iss !== JWT_ISSUER || claims.aud !== JWT_AUDIENCE) return null;
  if (!Number.isSafeInteger(claims.exp) || !Number.isSafeInteger(claims.iat)) return null;
  const seconds = Math.floor(now / 1000);
  if (claims.iat > seconds + 60) return null;
  if (!allowExpired && claims.exp <= seconds) return null;
  return claims;
}
