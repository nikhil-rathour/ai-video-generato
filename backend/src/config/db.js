import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows / Node.js SRV lookup issues with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if unable to set custom DNS
}

let isConnected = false;
let inMemoryStore = {
  users: [],
  projects: [],
  videoGenerations: [],
  scenes: [],
  mediaAssets: []
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('YOUR_MONGODB_URI') || uri.trim() === '') {
    console.log('[Database] MONGODB_URI not configured. Operating in high-performance local store mode.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[Database] MongoDB connection error (${error.message}). Switched to local persistent memory mode.`);
    isConnected = false;
    return false;
  }
};

export const getStore = () => inMemoryStore;
export const isDbConnected = () => isConnected;
