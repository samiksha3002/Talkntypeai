import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// ----------------------
// LOAD ENV FIRST
// ----------------------
dotenv.config({ path: ".env.local" }); // VERY IMPORTANT

// ----------------------
// ROUTES
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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ----------------------
// CORS
// ----------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://talkntype.com",
  "https://www.talkntype.com",
  "https://talkntype.onrender.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ BLOCKED ORIGIN:", origin);
      callback(new Error("CORS blocked: " + origin));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/^\/api\/(.*)/, cors(corsOptions));

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
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
