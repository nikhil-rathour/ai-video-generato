import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/db.js';
import './src/config/ffmpeg.js';
import './src/config/cloudinary.js';
import { getTempDir, getPublicOutputsDir, getPublicUploadsDir, isVercel } from './src/config/paths.js';

import videoRoutes from './src/routes/videoRoutes.js';
import qoneqtRoutes from './src/routes/qoneqtRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure writable directories exist (uses /tmp on Vercel, ./temp locally)
getTempDir();
const publicOutputs = getPublicOutputsDir();
const publicUploads = getPublicUploadsDir();

// Middlewares
// Vercel Rewrite URL Normalizer: restores original request URL when Vercel rewrites to /server.js
app.use((req, res, next) => {
  if (req.query && req.query.__url !== undefined) {
    req.url = '/' + String(req.query.__url).replace(/^\//, '');
  } else if (req.headers['x-matched-path'] && (req.url === '/server.js' || req.url === '/')) {
    req.url = req.headers['x-matched-path'];
  }
  next();
});
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : '*';

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file hosting for outputs, uploads (only meaningful locally; on Vercel use Cloudinary)
if (!isVercel) {
  const publicDir = path.resolve(__dirname, 'public');
  app.use(express.static(publicDir));
  app.use('/outputs', express.static(publicOutputs));
  app.use('/uploads', express.static(publicUploads));

  app.get('/presentation', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'presentation.html'));
  });
}

// API Routes
app.use('/api/video', videoRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/qoneqt', qoneqtRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Qoneqt AI Video Studio Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: isVercel ? 'vercel' : 'local'
  });
});

app.get('/', (req, res) => {
  res.send({
    status: 'online',
    app: 'Qoneqt AI Video Studio Engine',
  });
});

// 404 Catch-All Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl || req.url,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
});

// Process-level handlers so serverless function never terminates silently
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL Uncaught Exception]:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRITICAL Unhandled Rejection]:', reason);
});

// On Vercel: just connect DB and export app — do NOT call app.listen()
// On local: start the HTTP server normally
if (isVercel) {
  // Connect DB on cold start without binding a port
  connectDB().catch((err) => console.error('[Server] DB connection error:', err));
} else {
  const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🎬 QONEQT AI VIDEO STUDIO ENGINE RUNNING ON PORT: ${PORT}`);
      console.log(`🔗 Local Base URL: http://localhost:${PORT}`);
      console.log(`📡 Ready for AI Pipeline & FFmpeg Video Generation`);
      console.log(`=================================================`);
    });
  };
  startServer();
}

// Export for Vercel serverless handler
export default app;
