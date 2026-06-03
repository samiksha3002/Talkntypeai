// config.js
// Central configuration for TalkNType + LexArchive backend.
// All values fall back to safe defaults so the server starts without a .env file.

import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 5000,

  indianKanoon: {
    baseUrl: process.env.INDIAN_KANOON_BASE_URL || "https://api.indiankanoon.org",
    token:   process.env.INDIAN_KANOON_API_TOKEN || "",
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL_SECONDS || "300", 10), // 5 minutes default
  },
};

export default config;