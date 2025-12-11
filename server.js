import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import deepgramRoutes from "./routes/deepgram.js";
import caseRoutes from "./routes/cases.js";
import translationRoutes from "./routes/translation.js";
import aiChatRoutes from "./routes/aiChat.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------
// CONNECT MONGO
// ----------------------
connectDB();

// ----------------------
// BODY PARSING
// ----------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ----------------------
// CORS SETTINGS
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
    // Allows requests with no origin (like mobile apps, curl, or same-origin requests)
    if (!origin) return callback(null, true); 
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ BLOCKED ORIGIN:", origin);
      // NOTE: For debugging, comment out the line below to allow the server to start,
      // but in production, you want this error to block unauthorized origins.
      callback(new Error("CORS blocked: " + origin)); 
    }
  },
  credentials: true,
  // OPTIONS method is included here, so explicit app.options() is often redundant
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// **FIX:** Explicitly handle OPTIONS preflight requests for API routes
// The path-to-regexp library does not like '/api/*' syntax.
// We use '/api/:path*' which means 'match /api/ followed by any subpath'.
// This line fixes the 'PathError: Missing parameter name at index 6' crash.
app.options("/api/:path*", cors(corsOptions)); // CORRECTED LINE (was /api/*)

// ----------------------
// TEST ROUTE
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

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});