// middleware/rateLimiter.js
//
// Protects both our server and the upstream Indian Kanoon API
// from being hammered by too many requests.
//
import rateLimit from "express-rate-limit";

// General API limiter: 100 requests per minute per IP
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many requests. Please slow down." },
});

// Stricter limiter for search endpoint (IK has its own rate limits)
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      30,          // 30 searches per minute per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Search rate limit exceeded. Try again in a minute." },
});