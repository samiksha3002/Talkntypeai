import "./env.js";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import draftRouter             from "./routes/draft.routes.js";
import authRoutes              from "./routes/auth.js";
import adminRoutes             from "./routes/admin.js";
import deepgramRoutes          from "./routes/deepgram.js";
import chatTranslateRoute      from "./routes/chatTranslate.js";
import casesRoutes             from "./routes/cases.js";
import aiChatRoutes            from "./routes/aiChat.js";
import ocrRoutes               from "./routes/ocr.js";
import expandRoute             from "./routes/expand.js";
import fixGrammarRoute         from "./routes/fixGrammar.js";
import fontConvertRouter       from "./routes/fontConvert.js";
import transliterateFinalRoute from "./routes/transliteratefinal.js";
import dictionaryRoutes        from "./routes/dictionary.js";
import clientsRoutes           from "./routes/clients.js";
import inquiriesRouter         from "./routes/inquiries.js";
import teamRoute               from "./routes/team.js";
import reportsRoute            from "./routes/reports.js";
import paymentsRoute           from "./routes/payments.js";
import csvUploadRoute          from "./routes/csvUploadRoute.js";
import pdfRoutes               from "./routes/pdf.js";
import audioRoutes             from "./routes/audio.js";
import legalRoutes             from "./routes/legal.js";
import legalAiRoute            from "./routes/legalaidraft.js";

// ── LexArchive Route Imports ──────────────────────────────────────────────────
import judgementsRouter  from "./routes/judgements.js";
import savedRouter       from "./routes/saved.js";
import judgementAiRouter from "./routes/judgementAi.js";

// ── Middleware Imports ─────────────────────────────────────────────────────────
import { apiLimiter } from "./middleware/rateLimiter.js";

import searchablePdfRouter from "./routes/searchablePdf.routes.js";
import draftsRouter        from "./routes/draft.ready.js";

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);

const allowedOrigins = [
  // Local development
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",

  // Production
  "https://talkntype.pro",
  "https://www.talkntype.pro",

  // Existing typo/alternate domain kept intentionally
  "https://talkntpe.pro",
  "https://www.talkntpe.pro",
];

const corsOptions = {
  origin: (origin, callback) => {

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(
      "⚠️ CORS blocked origin:",
      origin
    );

    return callback(
      new Error(
        `CORS policy: origin ${origin} not allowed`
      )
    );
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  credentials: true,
 preflightContinue: false,
 optionsSuccessStatus: 204,
};



app.use(cors(corsOptions));
app.use(
  express.json({
    limit: "100mb",
  })
);

app.use(express.urlencoded({extended: true,limit: "100mb",}));

app.use((req, res, next) => {

  const start = Date.now();

  res.on("finish", () => {

    const duration = Date.now() - start;

    // Only log API requests
    if (req.originalUrl.startsWith("/api")) {

      console.log(
        `📡 ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
      );

    }
  });

  next();
});

app.use(
  "/api",
  apiLimiter
);

app.get(
  "/",
  (req, res) => {

    res.status(200).json({
      success: true,
      service: "TalkNType + LexArchive API",
      status: "running",
      message: "TalkNType Server Running!",
    });

  }
);


app.get(
  "/health",
  (req, res) => {

    res.status(200).json({
      success: true,
      status: "ok",
      service: "TalkNType API",
      time: new Date().toISOString(),
    });

  }
);

app.use( "/api",authRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/deepgram",deepgramRoutes);
app.use("/api/cases",casesRoutes);
app.use("/api/chattranslate",chatTranslateRoute);
app.use("/api/chat",aiChatRoutes);
app.use("/api/ocr", ocrRoutes);
app.use( "/api/expand", expandRoute);


// ── Fix Grammar ───────────────────────────────────────────────────────────────
app.use(
  "/api/fix-grammar",
  fixGrammarRoute
);


// ── Font Conversion ───────────────────────────────────────────────────────────
app.use(
  "/api/font",
  fontConvertRouter
);


// ── Drafts ────────────────────────────────────────────────────────────────────
app.use(
  "/api/draft",
  draftRouter
);


// ── Transliteration ───────────────────────────────────────────────────────────
app.use(
  "/api/transliterate",
  transliterateFinalRoute
);


// ── Clients ───────────────────────────────────────────────────────────────────
app.use(
  "/api/clients",
  clientsRoutes
);


// ── Inquiries ─────────────────────────────────────────────────────────────────
app.use(
  "/api/inquiries",
  inquiriesRouter
);


// ── Reports ───────────────────────────────────────────────────────────────────
app.use(
  "/api/reports",
  reportsRoute
);


// ── Team ──────────────────────────────────────────────────────────────────────
app.use(
  "/api/team",
  teamRoute
);


// ── Payments ──────────────────────────────────────────────────────────────────
app.use(
  "/api/payments",
  paymentsRoute
);


// ── Dictionary ────────────────────────────────────────────────────────────────
app.use(
  "/api/dictionary",
  dictionaryRoutes
);


// ── CSV Manager ───────────────────────────────────────────────────────────────
app.use(
  "/api/csv-manager",
  csvUploadRoute
);


// ── Legal Routes ──────────────────────────────────────────────────────────────
app.use(
  "/api",
  legalRoutes
);


// ── PDF Routes ────────────────────────────────────────────────────────────────
app.use(
  "/api",
  pdfRoutes
);


// ── Audio ─────────────────────────────────────────────────────────────────────
app.use(
  "/api/audio",
  audioRoutes
);


// ── Legal AI Drafting ─────────────────────────────────────────────────────────
app.use(
  "/api/legal-ai",
  legalAiRoute
);


// ── Advanced Draft System ─────────────────────────────────────────────────────
app.use(
  "/api/drafts",
  draftsRouter
);
app.use("/api/judgements",judgementsRouter);
app.use("/api/saved",savedRouter);
app.use("/api/judgement-ai",judgementAiRouter);
app.use( "/api/ocr", searchablePdfRouter);

app.use(
  (req, res) => {

    res.status(404).json({
      success: false,
      error: "Route not found.",
      path: req.originalUrl,
      method: req.method,
    });

  }
);

app.use(
  (err, req, res, next) => {

    console.error(
      "🔥 Server Error:",
      err?.stack || err?.message || err
    );


    // CORS error
    if (
      err?.message &&
      err.message.startsWith("CORS policy:")
    ) {

      return res.status(403).json({
        success: false,
        error: "CORS blocked",
        message: err.message,
      });

    }


    const statusCode =
      Number(err?.status) ||
      Number(err?.statusCode) ||
      500;


    const isProduction =
      process.env.NODE_ENV === "production";


    return res.status(statusCode).json({

      success: false,

      message:
        isProduction
          ? "Internal Server Error"
          : (
              err?.message ||
              "Internal Server Error"
            ),
    });

  }
);

app.listen(
  PORT,
  () => {

    console.log("");
    console.log("══════════════════════════════════════════════════");
    console.log("🚀 TalkNType + LexArchive Server Started");
    console.log("══════════════════════════════════════════════════");

    console.log(
      `🌐 Local: http://localhost:${PORT}`
    );

    console.log(
      `❤️ Health: http://localhost:${PORT}/health`
    );

    console.log(
      `🤖 AI Chat: http://localhost:${PORT}/api/chat`
    );

    console.log(
      `📚 Judgements: http://localhost:${PORT}/api/judgements`
    );

    console.log(
      `📄 Drafts: http://localhost:${PORT}/api/drafts`
    );

    console.log(
      `🔧 Environment: ${process.env.NODE_ENV || "development"}`
    );


    console.log(
      `🇮🇳 Indian Kanoon token: ${
        process.env.INDIAN_KANOON_API_TOKEN
          ? process.env.INDIAN_KANOON_API_TOKEN.slice(0, 8) + "..."
          : "❌ NOT SET"
      }`
    );

    console.log("══════════════════════════════════════════════════");
    console.log("");

  }
);