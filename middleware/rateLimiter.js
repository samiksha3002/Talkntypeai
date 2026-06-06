// middleware/rateLimiter.js

import rateLimit from "express-rate-limit";

// General: 100 req/min per IP
export const apiLimiter = rateLimit({
  windowMs        : 60 * 1000,
  max             : 100,
  standardHeaders : true,
  legacyHeaders   : false,
  message         : { error: "Too many requests. Please slow down." },
});

// Search: 30 req/min per IP (protects IK quota)
export const searchLimiter = rateLimit({
  windowMs        : 60 * 1000,
  max             : 30,
  standardHeaders : true,
  legacyHeaders   : false,
  message         : { error: "Search rate limit exceeded. Try again in a minute." },
});