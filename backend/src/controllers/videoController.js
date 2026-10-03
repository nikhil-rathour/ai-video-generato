import { v4 as uuidv4 } from 'uuid';
import VideoGeneration, { VideoStatus } from '../models/VideoGeneration.js';
import AIService from '../services/aiService.js';
import MediaService from '../services/mediaService.js';
import VoiceService from '../services/voiceService.js';
import RenderService from '../services/renderService.js';
import progressEmitter from '../utils/progressEmitter.js';
import { isDbConnected } from '../config/db.js';

let vercelWaitUntil = null;
try {
  const vFunc = await import('@vercel/functions');
  vercelWaitUntil = vFunc.waitUntil;
} catch (e) {
  // Local or non-Vercel environment
}

// In-memory fallback cache so jobs never fail or hang if MongoDB is cold/unavailable
const memoryVideoStore = new Map();

const updateVideoJob = async (id, update) => {
  const currentMem = memoryVideoStore.get(id) || {};
  const updatedMem = { ...currentMem, ...update, updatedAt: new Date() };
  memoryVideoStore.set(id, updatedMem);

  if (isDbConnected()) {
    try {
      const doc = await VideoGeneration.findByIdAndUpdate(id, update, { new: true });
      if (doc) return doc;
    } catch (e) {
      console.warn(`[Video Controller] DB update error for ${id} (using memory fallback):`, e.message);
    }
  }
  return updatedMem;
};

export class VideoController {
  /**
   * Main end-to-end video generation pipeline
   */
  static async generateVideo(req, res) {
    const { topic, duration = 30, style = 'Educational', language = 'English', aspectRatio = '9:16' } = req.body;

    if (!topic || topic.trim() === '') {
      return res.status(400).json({ error: 'Topic or idea prompt is required' });
    }

    let videoId = uuidv4();
    let videoGen = {
      _id: videoId,
      id: videoId,
      topic,
      duration: Number(duration) || 30,
      style,
      language,
      aspectRatio,
      status: VideoStatus.QUEUED,
      progress: 5,
      currentStep: 'Initializing AI Engine...',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 1. Create DB record in QUEUED state (with graceful fallback)
    if (isDbConnected()) {
      try {
        const created = await VideoGeneration.create({
          topic,
          duration: Number(duration) || 30,
          style,
          language,
          aspectRatio,
          status: VideoStatus.QUEUED,
          progress: 5,
          currentStep: 'Initializing AI Engine...',
        });
        videoId = created._id.toString();
        videoGen = created;
      } catch (dbErr) {
        console.warn('[Video Controller] DB create fallback to memory store:', dbErr.message);
      }
    }

    memoryVideoStore.set(videoId, videoGen);

    // Respond immediately with created job ID so frontend can connect to SSE/polling
    res.status(202).json({
      success: true,
      message: 'Video generation started',
      videoId,
      video: videoGen
    });

    // Build the pipeline as a named promise so waitUntil can keep the function alive on Vercel
    const runPipeline = async () => {
      try {
        // Step 1: LLM Scripting
        await updateVideoJob(videoId, {
          status: VideoStatus.SCRIPTING,
          progress: 15,
          currentStep: 'Topic analyzed & generating structured viral script...'
        });
        progressEmitter.notify(videoId, {
          status: VideoStatus.SCRIPTING,
          progress: 15,
          step: 'Topic analyzed & generating structured script...'
        });

        const scriptData = await AIService.generateScript({
          topic,
          duration: Number(duration) || 30,
          style,
          language
        });

        await updateVideoJob(videoId, {
          title: scriptData.title,
          description: scriptData.caption,
          hashtags: scriptData.hashtags,
          script: scriptData,
          scenes: scriptData.scenes,
          llmProvider: scriptData.providerUsed,
          progress: 30,
          currentStep: 'Script generated & scene storyboard plan created.'
        });
        progressEmitter.notify(videoId, {
          status: VideoStatus.SCRIPTING,
          progress: 30,
          step: 'Script & storyboard ready',
          script: scriptData
        });

        // Step 2: Media Asset Pipeline (parallel fetch)
        await updateVideoJob(videoId, {
          status: VideoStatus.COLLECTING_MEDIA,
          progress: 40,
          currentStep: 'Collecting stock video & generating visual assets...'
        });
        progressEmitter.notify(videoId, {
          status: VideoStatus.COLLECTING_MEDIA,
          progress: 40,
          step: 'Collecting stock videos...'
        });

        const scenesWithMedia = await MediaService.collectSceneAssets(scriptData.scenes, videoId);

        await updateVideoJob(videoId, {
          scenes: scenesWithMedia,
          progress: 55,
          currentStep: 'Visual assets processed & optimized.'
        });
        progressEmitter.notify(videoId, {
          status: VideoStatus.COLLECTING_MEDIA,
          progress: 55,
          step: 'Visual assets collected',
          scenes: scenesWithMedia
        });

        // Step 3: Voiceover Pipeline
        await updateVideoJob(videoId, {
          status: VideoStatus.GENERATING_VOICE,
          progress: 65,
          currentStep: 'Generating high-fidelity voice narration...'
        });
        progressEmitter.notify(videoId, {
          status: VideoStatus.GENERATING_VOICE,
          progress: 65,
          step: 'Synthesizing voiceover...'
        });

        const voiceResult = await VoiceService.generateVoice(scriptData.narration, videoId);

        await updateVideoJob(videoId, {
          voiceUrl: voiceResult.url,
          voiceLocalPath: voiceResult.localPath,
          voiceProvider: voiceResult.provider,
          progress: 75,
          currentStep: 'Voiceover generated & synchronized.'
        });
        progressEmitter.notify(videoId, {
          status: VideoStatus.GENERATING_VOICE,
          progress: 75,
          step: 'Voiceover generated',
          voiceUrl: voiceResult.url
        });

        // Step 4: Video Composition & FFmpeg Rendering Pipeline
        await updateVideoJob(videoId, {
          status: VideoStatus.RENDERING,
          progress: 80,
          currentStep: 'Rendering 1080x1920 MP4 with audio mixing & captions...'
        });
        progressEmitter.notify(videoId, {
          status: VideoStatus.RENDERING,
          progress: 80,
          step: 'Compositing video in FFmpeg...'
        });

        const renderResult = await RenderService.renderVideo({
          scenes: scenesWithMedia,
          voiceLocalPath: voiceResult.localPath,
          videoId,
          onProgress: (renderPct) => {
            const overallPct = 80 + Math.round(renderPct * 0.18);
            progressEmitter.notify(videoId, {
              status: VideoStatus.RENDERING,
              progress: overallPct,
              step: `Rendering video frames (${renderPct}%)...`
            });
          }
        });

        // Step 5: Completed!
        const updatedVideo = await updateVideoJob(videoId, {
          status: VideoStatus.COMPLETED,
          progress: 100,
          currentStep: 'Ready-to-publish vertical video ready!',
          videoUrl: renderResult.videoUrl,
          videoLocalPath: renderResult.videoLocalPath,
          thumbnailUrl: renderResult.thumbnailUrl,
        });

        progressEmitter.notify(videoId, {
          status: VideoStatus.COMPLETED,
          progress: 100,
          step: 'Video generation completed!',
          video: updatedVideo
        });
        console.log(`[Video Controller] Pipeline successfully finished for: ${videoId}`);

      } catch (pipelineErr) {
        console.error(`[Video Controller] Pipeline error for ${videoId}:`, pipelineErr);
        await updateVideoJob(videoId, {
          status: VideoStatus.FAILED,
          errorMessage: pipelineErr.message || 'An error occurred during video rendering'
        });
        progressEmitter.notify(videoId, {
          status: VideoStatus.FAILED,
          error: pipelineErr.message
        });
      }
    };

    // Use @vercel/functions waitUntil to keep the serverless function alive for the full pipeline.
    // Falls back to fire-and-forget on local or if waitUntil is unavailable.
    if (vercelWaitUntil) {
      vercelWaitUntil(runPipeline());
    } else {
      runPipeline();
    }
  }

  /**
   * SSE Endpoint for live progress stream
   */
  static streamProgress(req, res) {
    const { id } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    progressEmitter.addClient(id, res);
  }

  /**
   * Generates only script
   */
  static async generateScriptOnly(req, res) {
    try {
      const { topic, duration = 30, style = 'Educational', language = 'English' } = req.body;
      const script = await AIService.generateScript({ topic, duration, style, language });
      res.json({ success: true, script });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Collects assets only
   */
  static async collectAssetsOnly(req, res) {
    try {
      const { scenes, videoId = uuidv4() } = req.body;
      if (!Array.isArray(scenes)) {
        return res.status(400).json({ error: 'scenes array is required' });
      }
      const assets = await MediaService.collectSceneAssets(scenes, videoId);
      res.json({ success: true, assets });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Generates voice only
   */
  static async generateVoiceOnly(req, res) {
    try {
      const { narration, videoId = uuidv4() } = req.body;
      if (!narration) {
        return res.status(400).json({ error: 'narration is required' });
      }
      const voice = await VoiceService.generateVoice(narration, videoId);
      res.json({ success: true, voice });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Renders video only
   */
  static async renderVideoOnly(req, res) {
    try {
      const { scenes, voiceLocalPath, videoId = uuidv4() } = req.body;
      if (!scenes || !voiceLocalPath) {
        return res.status(400).json({ error: 'scenes and voiceLocalPath are required' });
      }
      const render = await RenderService.renderVideo({ scenes, voiceLocalPath, videoId });
      res.json({ success: true, render });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Fetch single video — tries DB first, falls back to in-memory active job store
   */
  static async getVideoById(req, res) {
    try {
      const { id } = req.params;

      // Try DB first
      if (isDbConnected()) {
        try {
          const video = await VideoGeneration.findById(id);
          if (video) return res.json({ success: true, video });
        } catch (dbErr) {
          console.warn('[Video Controller] DB lookup error, checking memory:', dbErr.message);
        }
      }

      // Fall back to in-memory store (for active jobs on serverless cold starts)
      const memVideo = memoryVideoStore.get(id);
      if (memVideo) return res.json({ success: true, video: memVideo });

      return res.status(404).json({ error: 'Video not found' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * List all videos — merges DB videos with any in-memory active jobs not yet in DB
   */
  static async getAllVideos(req, res) {
    try {
      let videos = [];

      if (isDbConnected()) {
        try {
          videos = await VideoGeneration.find({}).sort({ createdAt: -1 });
        } catch (dbErr) {
          console.warn('[Video Controller] DB list error, using memory store:', dbErr.message);
        }
      }

      // Merge in any active in-memory jobs that aren't in the DB result yet
      const dbIds = new Set(videos.map(v => v._id?.toString() || v.id));
      for (const [id, job] of memoryVideoStore.entries()) {
        if (!dbIds.has(id)) videos.unshift(job);
      }

      res.json({ success: true, count: videos.length, videos });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Delete video
   */
  static async deleteVideo(req, res) {
    try {
      const { id } = req.params;
      await VideoGeneration.deleteOne({ _id: id });
      res.json({ success: true, message: 'Video record deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default VideoController;
