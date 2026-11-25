// verify-token.mjs
// Checks that INDIAN_KANOON_API_TOKEN (from .env or your shell) is valid.
// Command: node verify-token.mjs --confirm-paid
//
// Makes 1 PAID search call (≈ ₹0.50), hence the flag. The token is never
// accepted on the command line (shell history) and never printed.
const PAID_NOTICE = "This makes 1 paid Indian Kanoon search (~₹0.50). Re-run with --confirm-paid to continue.";
import "dotenv/config";
import axios from "axios";

// The token is read only from the environment (.env or shell) and is never printed.
const TOKEN = process.env.INDIAN_KANOON_API_TOKEN;
if (!TOKEN) {
  console.error("Set INDIAN_KANOON_API_TOKEN in .env or your shell first.");
  process.exit(1);
}
if (!process.argv.includes("--confirm-paid")) {
  console.error(PAID_NOTICE);
  process.exit(1);
}

try {
  const { data } = await axios.post(
    "https://api.indiankanoon.org/search/?formInput=maneka+gandhi&pagenum=0",
    null,
    {
      timeout: 30000,
      headers: {
        "Authorization": `Token ${TOKEN}`,
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      }
    }
  );
  console.log("✅ TOKEN VALID!");
  console.log(`   Results: ${data.found}`);
  console.log(`   First:   ${data.docs?.[0]?.title?.slice(0, 70)}`);
} catch (err) {
  console.error(`❌ Status: ${err.response?.status}`);
  if (err.response?.status === 401) {
    console.error("   Token expired or invalid.");
    console.error("   👉 Go to: https://api.indiankanoon.org/access/");
    console.error("   👉 Click 'Regenerate Token' and copy the new token.");
    console.error("   👉 Update INDIAN_KANOON_API_TOKEN in your .env file.");
  }
}
