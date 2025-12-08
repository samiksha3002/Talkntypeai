import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js'; // Import DB logic
import caseRoutes from './routes/cases.js';
// Import Routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import deepgramRoutes from './routes/deepgram.js';
// import caseRoutes from './routes/cases.js'; // <-- UNCOMMENT WHEN YOU CREATE cases.js

// Load environment variables
dotenv.config({ path: './.env.local' });

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: true, 
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

// 2. Auth Routes (Prefix: /api)
// Matches: /api/create-user, /api/login
app.use('/api', authRoutes); 

// 3. Admin Routes (Prefix: /api/admin)
// Matches: /api/admin/users, /api/admin/delete-user/:id
app.use('/api/admin', adminRoutes);

// 4. Deepgram Route (Prefix: /api/deepgram)
app.use('/api/deepgram', deepgramRoutes);
// Case Routes
app.use('/api/cases', caseRoutes);
// 5. Case Routes (When you are ready)
// app.use('/api/cases', caseRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});