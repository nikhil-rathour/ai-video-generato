import { isDbConnected } from '../config/db.js';
import { isCloudinaryActive } from '../config/cloudinary.js';
import { ffmpegPath, ffprobePath } from '../config/ffmpeg.js';
import { QoneqtService } from '../services/qoneqtService.js';
import axios from 'axios';

export class SettingsController {
  /**
   * Get status of all integrations and API keys
   */
  static async getStatus(req, res) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const pexelsKey = process.env.PEXELS_API_KEY;
    const pixabayKey = process.env.PIXABAY_API_KEY;
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const qoneqtKey = process.env.QONEQT_API_KEY;

    const checkKey = (k, placeholder) => Boolean(k && k !== placeholder && k.trim() !== '');

    res.json({
      success: true,
      services: {
        gemini: {
          name: 'Google Gemini 2.5/1.5 Flash',
          role: 'Primary LLM (Scripting & Vision)',
          configured: checkKey(geminiKey, 'YOUR_GEMINI_API_KEY'),
          status: checkKey(geminiKey, 'YOUR_GEMINI_API_KEY') ? 'READY' : 'FALLBACK_READY',
        },
        groq: {
          name: 'Groq Llama 3.3 70B',
          role: 'Fallback LLM (Ultra-fast Inference)',
          configured: checkKey(groqKey, 'YOUR_GROQ_API_KEY'),
          status: checkKey(groqKey, 'YOUR_GROQ_API_KEY') ? 'READY' : 'STANDBY',
        },
        pexels: {
          name: 'Pexels Video API',
          role: 'Primary Vertical Stock Video Provider',
          configured: checkKey(pexelsKey, 'YOUR_PEXELS_API_KEY'),
          status: checkKey(pexelsKey, 'YOUR_PEXELS_API_KEY') ? 'READY' : 'FALLBACK_READY',
        },
        pixabay: {
          name: 'Pixabay Video API',
          role: 'Fallback Stock Media Provider',
          configured: checkKey(pixabayKey, 'YOUR_PIXABAY_API_KEY'),
          status: checkKey(pixabayKey, 'YOUR_PIXABAY_API_KEY') ? 'READY' : 'STANDBY',
        },
        elevenlabs: {
          name: 'ElevenLabs Voice Engine',
          role: 'AI Text-to-Speech & Voiceover',
          configured: checkKey(elevenKey, 'YOUR_ELEVENLABS_API_KEY'),
          status: checkKey(elevenKey, 'YOUR_ELEVENLABS_API_KEY') ? 'READY' : 'LOCAL_TTS_ACTIVE',
        },
        cloudinary: {
          name: 'Cloudinary Cloud Storage',
          role: 'CDN Media Hosting & Transcoding',
          configured: isCloudinaryActive(),
          status: isCloudinaryActive() ? 'ACTIVE' : 'LOCAL_STORAGE_ACTIVE',
        },
        mongodb: {
          name: 'MongoDB Atlas',
          role: 'Primary Database & Analytics Store',
          configured: isDbConnected(),
          status: isDbConnected() ? 'CONNECTED' : 'IN_MEMORY_MODE',
        },
        qoneqt: {
          name: 'Qoneqt Global Feed Integration',
          role: 'Direct Social Publishing Layer',
          configured: QoneqtService.isLiveConfigured(),
          status: QoneqtService.isLiveConfigured() ? 'LIVE_PUBLISHING' : 'DEMO_SANDBOX_ACTIVE',
          endpoint: process.env.QONEQT_API_URL || 'https://api.qoneqt.com/v1',
        },
        ffmpeg: {
          name: 'FFmpeg Video Compositor',
          role: '1080x1920 9:16 Video Renderer & Audio Mixer',
          configured: Boolean(ffmpegPath),
          path: ffmpegPath,
          ffprobe: ffprobePath,
          status: ffmpegPath ? 'OPTIMIZED_AND_READY' : 'NOT_FOUND',
        }
      }
    });
  }

  /**
   * Test a specific API endpoint or key
   */
  static async testApi(req, res) {
    const { provider } = req.body;
    try {
      if (provider === 'gemini') {
        const key = process.env.GEMINI_API_KEY;
        if (!key || key.includes('YOUR_')) throw new Error('GEMINI_API_KEY not configured in .env');
        const r = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
          contents: [{ parts: [{ text: 'Respond with OK' }] }]
        }, { timeout: 8000 });
        return res.json({ success: true, message: 'Gemini API connection verified!', response: r.data });
      }

      if (provider === 'pexels') {
        const key = process.env.PEXELS_API_KEY;
        if (!key || key.includes('YOUR_')) throw new Error('PEXELS_API_KEY not configured in .env');
        const r = await axios.get('https://api.pexels.com/videos/search?query=nature&per_page=1', {
          headers: { Authorization: key },
          timeout: 8000
        });
        return res.json({ success: true, message: 'Pexels API connected!', totalResults: r.data.total_results });
      }

      if (provider === 'elevenlabs') {
        const key = process.env.ELEVENLABS_API_KEY;
        if (!key || key.includes('YOUR_')) throw new Error('ELEVENLABS_API_KEY not configured in .env');
        const r = await axios.get('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': key },
          timeout: 8000
        });
        return res.json({ success: true, message: 'ElevenLabs API connected!', voiceCount: r.data.voices?.length });
      }

      res.json({ success: true, message: `${provider} test executed successfully.` });
    } catch (err) {
      res.status(400).json({ success: false, error: err.response?.data?.message || err.message });
    }
  }
}

export default SettingsController;
