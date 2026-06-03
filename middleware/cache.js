// middleware/cache.js
//
// Simple in-memory cache using node-cache.
// For production, swap NodeCache for a Redis client.
//

import NodeCache from "node-cache";
import config    from "../config.js";

const cache = new NodeCache({ stdTTL: config.cache.ttl, checkperiod: 120 });

// ─────────────────────────────────────────────────────────────────────────────
// cacheMiddleware(keyFn)
//   keyFn(req) → string cache key  (defaults to full URL)
//
// Usage in routes:
//   router.get('/search', cacheMiddleware(), judgementsController.search);
// ─────────────────────────────────────────────────────────────────────────────
export function cacheMiddleware(keyFn) {
  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.originalUrl;

    const cached = cache.get(key);
    if (cached !== undefined) {
      return res.json({ ...cached, _cached: true });
    }

    // Monkey-patch res.json to store response in cache before sending
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        cache.set(key, body);
      }
      return originalJson(body);
    };

    next();
  };
}

export { cache };