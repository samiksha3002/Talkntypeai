import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from 'cors'; // <-- Changed to import syntax

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
// For JSON data
app.use(express.json({ limit: "50mb" }));
// For URL-encoded data (note the limit setting)
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // <-- Consistent limit setting

// ----------------------
// 🔥 FIX: Standard CORS Configuration with Whitelist
// This is the correct logic that resolves the 'Access-Control-Allow-Origin' error.
// ----------------------
const allowedOrigins = [
    'https://www.talkntype.com', // 1. HTTPS with www
    'https://talkntype.com',     // 2. HTTPS without www
    'http://www.talkntype.com',  // 3. **IMPORTANT: HTTP with www**
    'http://talkntype.com',      // 4. **IMPORTANT: HTTP without www**
];

const corsOptions = {
    // Custom origin function remains the same
    origin: (origin, callback) => {
        // ... (rest of the logic is correct)
        if (!origin) return callback(null, true); 
        
        // Now checks against the expanded list including HTTP
        if (allowedOrigins.includes(origin) || origin.startsWith("http://localhost")) {
            // Success: allow the specific origin
            callback(null, true); 
        } else {
            // Failure: block the origin and log it
            console.error(`CORS Blocked Failure: Origin ${origin} not in allowed list: ${allowedOrigins.join(', ')}.`);
            callback(new Error(`CORS Blocked: Origin ${origin} is not allowed by policy.`), false); 
        }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204 // Handle preflight OPTIONS requests automatically
};


app.use(cors(corsOptions));

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
    // You can inspect if the error is a CORS error
    const statusCode = err.message.startsWith('CORS Blocked') ? 403 : 500; 

    res.status(statusCode).json({
        success: false,
        message: err.message.startsWith('CORS Blocked') ? "Forbidden: Origin not allowed." : "Internal Server Error",
    });
});

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});