// Test-only JWT helpers. Import this first in a test file: it sets a fixed,
// test-only signing secret when none is configured.
import { signJwt } from '../../utils/jwt.js';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-only-jwt-secret-not-used-anywhere-0123456789';
export const testJwt = (sub, jti, { expiresInSeconds = 3600, now } = {}) =>
  signJwt({ sub: String(sub), jti }, { expiresInSeconds, now });
