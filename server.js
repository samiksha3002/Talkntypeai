import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

// ----------------------
// ROUTE IMPORTS
// ----------------------
import draftRouter from "./routes/draft.routes.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import deepgramRoutes from "./routes/deepgram.js";
import chatTranslateRoute from "./routes/chatTranslate.js";
import casesRoutes from "./routes/cases.js";
import aiChatRoutes from "./routes/aiChat.js";
import ocrRoutes from "./routes/ocr.js";
import expandRoute from "./routes/expand.js";
import fixGrammarRoute from "./routes/fixGrammar.js";
import fontConvertRouter from "./routes/fontConvert.js";
import transliterateFinalRoute from "./routes/transliteratefinal.js";
import dictionaryRoutes from "./routes/dictionary.js";
import clientsRoutes from "./routes/clients.js";
import inquiriesRouter from "./routes/inquiries.js";
import teamRoute from "./routes/team.js";
import reportsRoute from "./routes/reports.js";
import paymentsRoute from "./routes/payments.js";

// --- THE CRITICAL ROUTES ---
import pdfRoutes from "./routes/pdf.js";
import audioRoutes from "./routes/audio.js";

// ----------------------
// CONFIGURATION
// ----------------------
dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------
// MIDDLEWARE
// ----------------------
// Increase limit for large files (Audio/PDF)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ----------------------
// CORS SETUP
// ----------------------
const allowedOrigins = [
  "https://www.talkntype.com",
  "https://talkntype.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn("❌ CORS Blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ----------------------
// ROUTE MOUNTING
// ----------------------
app.get("/", (req, res) => {
  res.send("TalkNType Server is Running!");
});

app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/deepgram", deepgramRoutes);
app.use("/api/cases", casesRoutes);
app.use("/api/chattranslate", chatTranslateRoute);
app.use("/api/chat", aiChatRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/expand", expandRoute);
app.use("/api/fix-grammar", fixGrammarRoute);
app.use("/api/font-convert", fontConvertRouter);
app.use("/api/draft", draftRouter);
app.use("/api/transliterate", transliterateFinalRoute);
app.use("/api/clients", clientsRoutes);
app.use("/api/inquiries", inquiriesRouter);
app.use("/api/reports", reportsRoute);
app.use("/api/team", teamRoute);
app.use("/api/payments", paymentsRoute);
app.use("/api/dictionary", dictionaryRoutes);

// --- PDF & AUDIO ---
// These are mounted at /api, so the full paths will be:
// /api/upload-pdf
// /api/audio-to-text
app.use("/api", pdfRoutes);
app.use("/api", audioRoutes);

// ----------------------
// ERROR HANDLER
// ----------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack || err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});