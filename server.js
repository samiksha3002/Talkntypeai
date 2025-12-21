import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

// ----------------------
// LOAD ENV VARIABLES
// ----------------------
dotenv.config(); 

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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// ----------------------
// ROUTE IMPORTS (ESM)
// ----------------------
import draftRouter from "./routes/draft.routes.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import deepgramRoutes from "./routes/deepgram.js";
import chatTranslateRoute from "./routes/chatTranslate.js";
import casesRoutes from "./routes/cases.js";
import aiChatRoutes from "./routes/aiChat.js";
import ocrRoutes from "./routes/ocr.js";
import audioToTextRoutes from "./routes/audioToText.js";
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

// ----------------------
// ROUTES
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
app.use("/api/audio-to-text", audioToTextRoutes);
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
app.use("/api/dictionary", dictionaryRoutes); // ✅ Dictionary Route

// ----------------------
// ERROR HANDLER
// ----------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack || err.message);
  const statusCode = err.message?.includes("CORS") ? 403 : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // ✅ DEBUG: Safely print all registered routes
  console.log("📍 Active Routes Check:");
  if (app._router && app._router.stack) {
    app._router.stack.forEach((r) => {
      if (r.route && r.route.path) {
        console.log(`- ${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
      } else if (r.name === 'router') {
        r.handle.stack.forEach((handler) => {
          if (handler.route) {
            // Cleans regex to show human-readable path
            const base = r.regexp.source.replace("^\\", "").replace("\\/?(?=\\/|$)", "").replace(/\\\//g, "/");
            console.log(`- ${Object.keys(handler.route.methods).join(',').toUpperCase()} ${base}${handler.route.path}`);
          }
        });
      }
    });
  } else {
    console.log("Router stack not yet initialized.");
  }
});