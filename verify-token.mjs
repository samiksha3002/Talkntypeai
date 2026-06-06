// verify-token.mjs
// Run: node verify-token.mjs YOUR_TOKEN_HERE
// Example: node verify-token.mjs d2fbb3b9b94e1478a646646d28eeb54334a0b99e

import axios from "axios";

const token = process.argv[2] || process.env.INDIAN_KANOON_API_TOKEN;

if (!token) {
  console.error("Usage: node verify-token.mjs <your_token>");
  process.exit(1);
}

console.log(`\nTesting token: ${token.slice(0,8)}...${token.slice(-4)} (length: ${token.length})\n`);

try {
  const { data } = await axios.post(
    "https://api.indiankanoon.org/search/?formInput=maneka+gandhi&pagenum=0",
    null,
    {
      timeout: 30000,
      headers: {
        "Authorization": `Token ${token}`,
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      }
    }
  );
  console.log("✅ TOKEN VALID!");
  console.log(`   Results: ${data.found}`);
  console.log(`   First:   ${data.docs?.[0]?.title?.slice(0, 70)}`);
  console.log(`\n👉 Copy this token to your .env:\n   INDIAN_KANOON_API_TOKEN=${token}`);
} catch (err) {
  console.error(`❌ Status: ${err.response?.status}`);
  if (err.response?.status === 401) {
    console.error("   Token expired or invalid.");
    console.error("   👉 Go to: https://api.indiankanoon.org/access/");
    console.error("   👉 Click 'Regenerate Token' and copy the new token.");
    console.error("   👉 Update INDIAN_KANOON_API_TOKEN in your .env file.");
  }
}
