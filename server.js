// ----------------------
// IMPORTS
// ----------------------
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

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

// ----------------------
// APP INIT
// ----------------------
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
// ✅ GLOBAL CORS CONFIG
// ----------------------
const allowedOrigins = [
  "https://www.talkntype.com",
  "https://talkntype.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server or curl
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

// ✅ Apply CORS globally before routes
app.use(cors(corsOptions));

// ----------------------
// ROUTES
// ----------------------
app.get("/", (req, res) => {
  res.send("TalkNType Server is Running!");
});

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
  const statusCode = err.message.includes("CORS") ? 403 : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
  });
});

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
