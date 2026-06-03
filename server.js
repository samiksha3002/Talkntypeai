import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// ── TalkNType Route Imports ───────────────────────────────────────────────────
import draftRouter            from "./routes/draft.routes.js";
import authRoutes             from "./routes/auth.js";
import adminRoutes            from "./routes/admin.js";
import deepgramRoutes         from "./routes/deepgram.js";
import chatTranslateRoute     from "./routes/chatTranslate.js";
import casesRoutes            from "./routes/cases.js";
import aiChatRoutes           from "./routes/aiChat.js";
import ocrRoutes              from "./routes/ocr.js";
import expandRoute            from "./routes/expand.js";
import fixGrammarRoute        from "./routes/fixGrammar.js";
import fontConvertRouter      from "./routes/fontConvert.js";
import transliterateFinalRoute from "./routes/transliteratefinal.js";
import dictionaryRoutes       from "./routes/dictionary.js";
import clientsRoutes          from "./routes/clients.js";
import inquiriesRouter        from "./routes/inquiries.js";
import teamRoute              from "./routes/team.js";
import reportsRoute           from "./routes/reports.js";
import paymentsRoute          from "./routes/payments.js";
import csvUploadRoute         from "./routes/csvUploadRoute.js";
import pdfRoutes              from "./routes/pdf.js";
import audioRoutes            from "./routes/audio.js";
import legalRoutes            from "./routes/legal.js";
import legalAiRoute           from "./routes/legalaidraft.js";

// ── LexArchive Route Imports ──────────────────────────────────────────────────
import judgementsRouter from "./routes/judgements.js";
import savedRouter      from "./routes/saved.js";

// ── LexArchive Middleware Imports ─────────────────────────────────────────────
// NOTE: if rateLimiter uses CommonJS exports, rename it rateLimiter.js → rateLimiter.mjs
// or add "type": "module" to its package.json, or use createRequire.
// If you keep it as a .js CJS file, import it like this instead:
//   import { createRequire } from "module";
//   const require = createRequire(import.meta.url);
//   const { apiLimiter } = require("./middleware/rateLimiter.js");
import { apiLimiter } from "./middleware/rateLimiter.js";

// ── Bootstrap ─────────────────────────────────────────────────────────────────
dotenv.config();
connectDB();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",   // Vite dev server
    "http://localhost:3000",   // CRA dev server
    "*",                       // keep existing wildcard for production if needed
  ],
  methods:      ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// ── Rate Limiting (LexArchive) ────────────────────────────────────────────────
// Applied only to /api/* so it covers all API routes in one place.
app.use("/api", apiLimiter);

// ── Health / Root ─────────────────────────────────────────────────────────────
app.get("/",       (req, res) => res.send("TalkNType Server Running!"));
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date() }));

// ── TalkNType Routes ──────────────────────────────────────────────────────────
app.use("/api",              authRoutes);
app.use("/api/admin",        adminRoutes);
app.use("/api/deepgram",     deepgramRoutes);
app.use("/api/cases",        casesRoutes);
app.use("/api/chattranslate", chatTranslateRoute);
app.use("/api/chat",         aiChatRoutes);
app.use("/api/ocr",          ocrRoutes);
app.use("/api/expand",       expandRoute);
app.use("/api/fix-grammar",  fixGrammarRoute);
app.use("/api/font-convert", fontConvertRouter);
app.use("/api/draft",        draftRouter);
app.use("/api/transliterate", transliterateFinalRoute);
app.use("/api/clients",      clientsRoutes);
app.use("/api/inquiries",    inquiriesRouter);
app.use("/api/reports",      reportsRoute);
app.use("/api/team",         teamRoute);
app.use("/api/payments",     paymentsRoute);
app.use("/api/dictionary",   dictionaryRoutes);
app.use("/api/csv-manager",  csvUploadRoute);
app.use("/api",              legalRoutes);
app.use("/api",              pdfRoutes);       // exposes /api/upload-pdf etc.
app.use("/api/audio",        audioRoutes);
app.use("/api/legal-ai",     legalAiRoute);

// ── LexArchive Routes ─────────────────────────────────────────────────────────
app.use("/api/judgements", judgementsRouter);
app.use("/api/saved",      savedRouter);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error("🔥 Server Error:", err.stack || err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 TalkNType + LexArchive server running on http://localhost:${PORT}`);

  if (!process.env.INDIAN_KANOON_API_TOKEN) {
    console.warn("⚠️  INDIAN_KANOON_API_TOKEN is not set — LexArchive API calls will fail.");
  }
});
