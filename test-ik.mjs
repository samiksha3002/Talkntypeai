// test-ik.mjs
// Checks Indian Kanoon API connectivity WITHOUT the full server.
// Command: node test-ik.mjs --confirm-paid
//
// Makes 2 PAID calls (1 search ≈ ₹0.50, 1 document ≈ ₹0.20), hence the flag.
const PAID_NOTICE = "This makes 2 paid Indian Kanoon calls (~₹0.70). Re-run with --confirm-paid to continue.";
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

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Indian Kanoon API — Direct Test");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Token: set");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

const IK = axios.create({
  baseURL : "https://api.indiankanoon.org",
  timeout : 30000,
  headers : {
    Authorization  : `Token ${TOKEN}`,
    Accept         : "application/json",
    "Content-Type" : "application/x-www-form-urlencoded",
  },
});

async function test() {
  // ── Test 1: Simple search POST ─────────────────────
  console.log("TEST 1: POST /search/ — query: 'maneka gandhi'");
  try {
    const { data } = await IK.post(
      `/search/?formInput=${encodeURIComponent("maneka gandhi")}&pagenum=0`
    );
    console.log("✅ Search OK!");
    console.log(`   Found: ${data.found} results`);
    console.log(`   First result: ${data.docs?.[0]?.title?.slice(0, 60)}`);
  } catch (err) {
    console.error("❌ Search FAILED");
    console.error(`   Status : ${err.response?.status}`);
    console.error(`   Code   : ${err.code}`);
    console.error(`   Message: ${err.message}`);

    if (err.code === "ECONNABORTED") {
      console.error("\n   → TIMEOUT: IK server nahi respond kar raha.");
      console.error("     Try karo: kya aap India mein hain? ISP block kar sakta hai.");
      console.error("     Ya token expire ho gaya ho.");
    }
    if (err.response?.status === 403) {
      console.error("\n   → 403 FORBIDDEN: Token galat ya expired hai.");
      console.error("     api.indiankanoon.org pe jao aur token regenerate karo.");
    }
    if (err.response?.status === 401) {
      console.error("\n   → 401 UNAUTHORIZED: Token missing ya format galat.");
    }
    if (err.code === "ENOTFOUND") {
      console.error("\n   → DNS ERROR: api.indiankanoon.org resolve nahi ho raha.");
      console.error("     Internet connection check karo.");
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // ── Test 2: Known doc fetch ────────────────────────
  console.log("TEST 2: POST /doc/74326/ — known SC judgement");
  try {
    const { data } = await IK.post("/doc/74326/");
    console.log("✅ Doc fetch OK!");
    console.log(`   Title: ${data.title?.slice(0, 60)}`);
  } catch (err) {
    console.error("❌ Doc fetch FAILED");
    console.error(`   Status : ${err.response?.status}`);
    console.error(`   Message: ${err.message}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Done.");
}

test();
