import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; 

// Import all existing Routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import deepgramRoutes from './routes/deepgram.js';
import caseRoutes from './routes/cases.js';

// 🚀 CRITICAL FIX: Simplify the import to directly get the default exported router function.
// This makes 'translationRoutes' the function Express needs.
import translationRoutes from './routes/translation.js'; 


// Load environment variables
dotenv.config(); // Loads .env file by default

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// 🛑 FIX: Set the Google Credentials Environment Variable 🛑
// This is critical for the Google client to authenticate.
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH;
}

// Connect to Database
connectDB();

// --- MIDDLEWARE ---
app.use(cors({
    origin: true, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Middleware to parse incoming JSON body (CRUCIAL for translation request)
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

// 6. 🌐 GOOGLE TRANSLATION ROUTE 
// 🛑 FINAL FIX: Now that we have a direct import, we use the variable directly.
app.use('/api/translate', translationRoutes);


// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});