import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 5000,

  indianKanoon: {
    baseUrl: process.env.INDIAN_KANOON_BASE_URL || "https://api.indiankanoon.org",
    token:   process.env.INDIAN_KANOON_API_TOKEN || "",
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL_SECONDS || "300", 10),
  },
};

if (!config.indianKanoon.token) {
  console.warn("⚠️  INDIAN_KANOON_API_TOKEN not set — LexArchive calls will fail.");
} else {
  console.log(`✅ Indian Kanoon token loaded: ${config.indianKanoon.token.slice(0, 6)}...`);
}

export default config;