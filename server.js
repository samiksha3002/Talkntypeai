import express from "express";

import dotenv from "dotenv";
import connectDB from "./config/db.js";

import cors from 'cors';
// ----------------------
// LOAD ENV FIRST
// ----------------------
dotenv.config();

// ----------------------
// ROUTE IMPORTS
// ----------------------
import aiRoutes from "./routes/ai.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import deepgramRoutes from "./routes/deepgram.js";
import caseRoutes from "./routes/cases.js";
import translationRoutes from "./routes/translation.js";
import aiChatRoutes from "./routes/aiChat.js";
import ocrRoutes from "./routes/ocr.js";
import audioToTextRoutes from "./routes/audioToText.js";
import expandRoute from "./routes/expand.js";
import fixGrammarRoute from "./routes/fixGrammar.js";
import fontConvertRoute from "./routes/fontConvert.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------
// CONNECT DATABASE
// ----------------------
connectDB();

// ----------------------
// BODY PARSER
// ----------------------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ----------------------
// 🔥 FINAL, ULTIMATE CORS FIX (Use app.use(cors()) for simplicity and robustness)
// This is the simplest and most forgiving way to enable CORS for all origins.
// ----------------------
app.use(cors());

// --- CRUCIAL MANUAL PREFLIGHT HANDLER ---
// Add explicit headers for all requests, and handle OPTIONS directly
app.use((req, res, next) => {
    // This is the most permissive header to allow all origins
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests (OPTIONS) directly
    if (req.method === 'OPTIONS') {
        // Send a 200 OK status code for preflight requests
        return res.sendStatus(200); 
    }
    next();
});

// ----------------------
// ROOT
// ----------------------
app.get("/", (req, res) => {
  res.send("TalkNType Server is Running!");
});

// ----------------------
// API ROUTES
// ----------------------
app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/deepgram", deepgramRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/translate", translationRoutes);
app.use("/api/chat", aiChatRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/audio-to-text", audioToTextRoutes);
app.use("/api/expand", expandRoute);
app.use("/api/fix-grammar", fixGrammarRoute);
app.use("/api/font-convert", fontConvertRoute);
app.use("/api/ai", aiRoutes);

// ----------------------
// ERROR HANDLER
// ----------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});