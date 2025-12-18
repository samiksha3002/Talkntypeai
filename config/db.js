// config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });

const connectDB = async () => {
  try {
    const dbURI =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://localhost:27017/talkntype';

    // Recommended options for stable connection
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1); // Stop server if DB fails
  }
};

export default connectDB;
