// middleware/cache.js

import NodeCache from "node-cache";
import config    from "../config.js";

const cache = new NodeCache({
  stdTTL      : config.cache.ttl,
  checkperiod : 120,
});

// ─────────────────────────────────────────────────────────────────────────────
// cacheMiddleware(keyFn)
//   keyFn(req) → string   (defaults to req.originalUrl)
// ─────────────────────────────────────────────────────────────────────────────
export function cacheMiddleware(keyFn) {
  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.originalUrl;

    const hit = cache.get(key);
    if (hit !== undefined) {
      return res.json({ ...hit, _cached: true });
    }

    // Intercept res.json to store successful responses
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