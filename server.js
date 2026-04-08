// server.js 
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// CONFIGURATION (Pehle load hona chahiye)
dotenv.config();

import connectDB from "./config/db.js";
connectDB();

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
import csvUploadRoute from "./routes/csvUploadRoute.js";
import pdfRoutes from "./routes/pdf.js";
import audioRoutes from "./routes/audio.js";
import legalRoutes from "./routes/legal.js";
import legalAiRoute from './routes/legalaidraft.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------
// MIDDLEWARE & CORS
// ----------------------
// CORS should be before routes
app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

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
app.use("/api/csv-manager", csvUploadRoute);
app.use('/api', legalRoutes);
app.use("/api", pdfRoutes);
app.use("/api/audio", audioRoutes);
app.use('/api/legal-ai', legalAiRoute);

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
  console.log("Current DB URI Status:", process.env.MONGO_URI ? "Connected" : "Missing URI");
});
import legalAiRoute from './routes/legalaidraft.js';
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
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

//app.use(fileUpload({
   // useTempFiles: true,
  // tempFileDir: '/tmp/',
 //   debug: true // इससे आपको टर्मिनल में एरर का पता चलेगा
//}));

// ----------------------
// CORS SETUP
// ----------------------
const allowedOrigins = [
 "https://talkntypeai.vercel.app",
  "https://www.talkntype.pro",
  "https://talkntype.pro",
  "http://localhost:3000",
  "http://localhost:5173",
];

// ----------------------
// CORS SETUP
// ----------------------
app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ----------------------
// ROUTE MOUNTING
// ----------------------


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
app.use("/api/csv-manager", csvUploadRoute);
app.use('/api', legalRoutes);
// --- PDF & AUDIO ---
// These are mounted at /api, so the full paths will be:
// /api/upload-pdf
// /api/audio-to-text
app.use("/api", pdfRoutes);
app.use("/api/audio", audioRoutes);
app.use('/api/legal-ai', legalAiRoute);
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
