import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB Connection SUCCESS!');
    console.log('Connected to:', conn.connection.host);
    
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ MongoDB Connection FAILED!');
    console.log('Error:', error.message);
    process.exit(1);
  }
}

testConnection();
