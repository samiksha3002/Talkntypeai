// routes/judgements.js

import express                    from "express";
import ctrl                       from "../controllers/judgementsController.js";
import { cacheMiddleware }        from "../middleware/cache.js";
import { searchLimiter }          from "../middleware/rateLimiter.js";

const router = express.Router();

// Cache key builders
const searchKey = (req) => `search:${JSON.stringify(req.query)}`;
const docKey    = (req) => `doc:${req.params.docid}`;
const fragKey   = (req) => `frag:${req.params.docid}:${req.query.q}`;

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/judgements/latest
router.get("/latest",
  cacheMiddleware(() => "latest"),
  ctrl.getLatest
);

// GET /api/judgements/search?q=maneka+gandhi&page=0&court=Supreme+Court
router.get("/search",
  searchLimiter,
  cacheMiddleware(searchKey),
  ctrl.search
);

// GET /api/judgements/:docid/fragment?q=article+21
router.get("/:docid/fragment",
  cacheMiddleware(fragKey),
  ctrl.getFragment
);

// GET /api/judgements/:docid
router.get("/:docid",
  cacheMiddleware(docKey),
  ctrl.getById
);

export default router;