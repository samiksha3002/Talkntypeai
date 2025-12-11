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
// CONNECT MONGODB
// ----------------------
connectDB();

// ----------------------
// JSON PARSING LIMIT
// ----------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ----------------------
// CORS CONFIG (FIXED)
// ----------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://talkntype.com",
  "https://www.talkntype.com",
  "https://talkntype.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server and mobile apps
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("❌ BLOCKED ORIGIN:", origin);
        return callback(new Error("CORS blocked: " + origin), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight manually
app.options("*", cors());

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

// Gemini AI Legal Assistant (CHAT)
app.use("/api/chat", aiChatRoutes);

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
