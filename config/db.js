import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env vars if not already loaded
dotenv.config({ path: './.env.local' });

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/talkntype';
    
    await mongoose.connect(dbURI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1); // Stop server if DB fails
  }
};

export default connectDB;