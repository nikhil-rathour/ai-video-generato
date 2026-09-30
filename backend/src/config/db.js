import mongoose from 'mongoose';
import dns from 'dns';

// Force Node.js to use Google DNS only for local development (not on Vercel serverless where 8.8.8.8:53 is blocked)
if (!process.env.VERCEL) {
  try {
    dns.setDefaultResultOrder('ipv4first');
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (e) {
    console.warn('[Database] Custom DNS setup skipped:', e.message);
  }
}

let isConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.warn('[Database] ⚠️  MONGODB_URI is not set — DB features will be unavailable.');
    return;
  }

  if (isConnected) {
    console.log('[Database] Already connected to MongoDB Atlas.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      family: 4, // Use IPv4, avoids IPv6 DNS issues
    });
    isConnected = true;
    console.log(`[Database] ✅ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database] ❌ MongoDB Atlas connection failed: ${error.message}`);
    // Log but don't crash the serverless function — DB-dependent routes will fail gracefully
  }
};

export const isDbConnected = () => isConnected;
