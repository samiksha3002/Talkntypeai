import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

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
// ALLOWED ORIGINS
// ----------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://talkntype.com",
  "https://www.talkntype.com",
];

// ----------------------
// CORS OPTIONS (FIXED)
// ----------------------
const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server / curl / mobile apps
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("⚠️ CORS BLOCKED:", origin);
    return callback(null, false); // ❌ DO NOT THROW ERROR
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
};

// ----------------------
// APPLY CORS (GLOBAL)
// ----------------------
app.use(cors(corsOptions));

// ----------------------
// HANDLE PREFLIGHT EXPLICITLY
// ----------------------
app.options("*", cors(corsOptions));

// ----------------------
// ROOT ROUTE
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
// ERROR HANDLER (SAFE)
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
  console.log("🛡️ CORS allowed origins:");
  allowedOrigins.forEach((o) => console.log("   ✔", o));
});
