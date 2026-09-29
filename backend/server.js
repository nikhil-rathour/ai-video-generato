import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/db.js';
import './src/config/ffmpeg.js';
import './src/config/cloudinary.js';

import videoRoutes from './src/routes/videoRoutes.js';
import qoneqtRoutes from './src/routes/qoneqtRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure directories exist
const tempDir = path.resolve('temp');
const publicOutputs = path.resolve('public', 'outputs');
const publicUploads = path.resolve('public', 'uploads');

[tempDir, publicOutputs, publicUploads].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file hosting for outputs, uploads and presentations
app.use(express.static(path.resolve('public')));
app.use('/outputs', express.static(publicOutputs));
app.use('/uploads', express.static(publicUploads));
app.use('/temp', express.static(tempDir));

app.get('/presentation', (req, res) => {
  res.sendFile(path.resolve('public', 'presentation.html'));
});

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
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Qoneqt AI Video Studio API</title></head>
      <body style="font-family: sans-serif; background: #0b0f19; color: #fff; padding: 40px; text-align: center;">
        <h1 style="color: #8b5cf6;">🚀 Qoneqt AI Video Studio Backend Running</h1>
        <p>API is healthy and listening on port ${PORT}</p>
        <p><a href="/api/settings/status" style="color: #06b6d4;">Inspect API Integration Status</a></p>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start Server
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
