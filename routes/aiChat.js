import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs'; 
import connectDB from './config/db.js'; 

// Import all existing Routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import deepgramRoutes from './routes/deepgram.js';
import caseRoutes from './routes/cases.js';
import translationRoutes from './routes/translation.js'; 
import aiChatRoutes from './routes/aiChat.js'; // ✅ NEW IMPORT

// Load environment variables
dotenv.config();

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// 🛑 1. GOOGLE CREDENTIALS SETUP (Live & Local) 🛑
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    // SCENARIO 1: Live Server
    const credentialsPath = './google-credentials.json';
    try {
        fs.writeFileSync(credentialsPath, process.env.GOOGLE_CREDENTIALS_JSON);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
        console.log("✅ Live Server: Google Credentials file created successfully.");
    } catch (err) {
        console.error("❌ Error creating credentials file:", err);
    }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH) {
    // SCENARIO 2: Local Development
    process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH;
    console.log("✅ Local Server: Using credentials from path.");
}

// Connect to Database
connectDB();

// 🛑 2. SECURE CORS SETUP 🛑
const allowedOrigins = [
    "http://localhost:5173",          // Local React App
    "http://localhost:3000",          // Alternative Local Port
    "https://www.talkntype.com",      // Live Domain
    "https://talkntype.onrender.com"  // Backend URL
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(null, true); 
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json());

// --- ROUTES ---

// 1. Health Check
app.get('/', (req, res) => {
    res.send('TalkNType Server is Running!');
});

// 2. Auth Routes
app.use('/api', authRoutes); 

// 3. Admin Routes
app.use('/api/admin', adminRoutes);

// 4. Deepgram Route
app.use('/api/deepgram', deepgramRoutes);

// 5. Case Routes
app.use('/api/cases', caseRoutes);

// 6. Translation Route 
app.use('/api/translate', translationRoutes);

// 7. ⚖️ NEW: AI CHAT ROUTE
app.use('/api/chat', aiChatRoutes); 


// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});