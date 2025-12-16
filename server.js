import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------
// ✅ FIXED CORS CONFIG
// ----------------------
const allowedOrigins = [
  "https://www.talkntype.com",
  "https://talkntype.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ----------------------
// BODY PARSER
// ----------------------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ----------------------
// ROUTES
// ----------------------
app.get("/", (req, res) => {
  res.send("TalkNType Server is Running!");
});

// mount your routes AFTER cors
import aiChatRoutes from "./routes/aiChat.js";
app.use("/api/chat", aiChatRoutes);

// ... other routes

// ----------------------
// ERROR HANDLER
// ----------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  res.status(500).json({ success: false, message: err.message });
});

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
