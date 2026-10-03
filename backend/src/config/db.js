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
let connectionPromise = null;

export const connectDB = async (timeoutMs = 8000) => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.warn('[Database] ⚠️  MONGODB_URI is not set — DB features will be unavailable.');
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  // Reuse in-flight connection attempt
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: timeoutMs,
        connectTimeoutMS: timeoutMs,
        family: 4, // Use IPv4, avoids IPv6 DNS issues
      });
      isConnected = true;
      console.log(`[Database] ✅ MongoDB Atlas Connected: ${conn.connection.host}`);
      return true;
    } catch (error) {
      console.error(`[Database] ❌ MongoDB Atlas connection failed: ${error.message}`);
      isConnected = false;
      return false;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
};

export const ensureConnected = async (timeoutMs = 5000) => {
  if (mongoose.connection.readyState === 1) return true;

  try {
    return await Promise.race([
      connectDB(timeoutMs),
      new Promise((resolve) => setTimeout(() => resolve(false), timeoutMs))
    ]);
  } catch {
    return false;
  }
};

export const isDbConnected = () => mongoose.connection.readyState === 1;
