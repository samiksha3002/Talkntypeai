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
// 🔥 FIX: Standard CORS Configuration with Whitelist
// This replaces the old CORS logic and removes the manual OPTIONS handler
// ----------------------
const allowedOrigins = [
    'https://www.talkntype.com', // Your main production domain
    'https://talkntype.com',     // Your secondary production domain
    'https://talkntype.onrender.com', // Added: The API's own host (Render URL)
    // Add other testing or staging origins here if needed.
];

const corsOptions = {
    // Check if the requesting origin is in the allowed list
    origin: (origin, callback) => {
        // 1. Allow requests with no origin (e.g., from Postman, cURL, or server-to-server)
        if (!origin) return callback(null, true);
        
        // 2. Allow whitelisted domains OR any localhost development instance
        if (allowedOrigins.includes(origin) || origin.startsWith("http://localhost")) {
            // Set the Access-Control-Allow-Origin header to the specific origin
            callback(null, true); 
        } else {
            // Block the origin if it's not whitelisted and log the failure
            console.error(`CORS Blocked Failure: Origin ${origin} not in allowed list: ${allowedOrigins.join(', ')}.`);
            callback(new Error(`CORS Blocked: Origin ${origin}`), false); 
        }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204 // Handle preflight OPTIONS requests automatically
};

// Apply the standard CORS middleware globally
app.use(cors(corsOptions));

// NOTE: The previous manual 'FORCE PREFLIGHT' block has been removed as it conflicted
// with the standard 'cors' middleware handling of OPTIONS requests.

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