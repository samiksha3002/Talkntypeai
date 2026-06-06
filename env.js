// env.js
// This file exists for ONE reason only:
// ES Modules execute ALL imports before any code runs.
// So dotenv.config() inside server.js runs TOO LATE —
// all other imported files have already read process.env.
//
// Solution: put dotenv.config() here, import this file FIRST in server.js
// import "./env.js"  ← must be line 1 of server.js

import dotenv from "dotenv";
dotenv.config();

console.log(`[env] .env loaded — IK token: ${
  process.env.INDIAN_KANOON_API_TOKEN
    ? process.env.INDIAN_KANOON_API_TOKEN.slice(0, 8) + "..."
    : "❌ NOT SET — check your .env file"
}`);