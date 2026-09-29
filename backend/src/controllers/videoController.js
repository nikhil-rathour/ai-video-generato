import { v4 as uuidv4 } from 'uuid';
import VideoGeneration, { VideoStatus } from '../models/VideoGeneration.js';
import AIService from '../services/aiService.js';
import MediaService from '../services/mediaService.js';
import VoiceService from '../services/voiceService.js';
import RenderService from '../services/renderService.js';
import progressEmitter from '../utils/progressEmitter.js';

export class VideoController {
  /**
   * Main end-to-end video generation pipeline
   */
  static async generateVideo(req, res) {
    const { topic, duration = 30, style = 'Educational', language = 'English', aspectRatio = '9:16' } = req.body;

    if (!topic || topic.trim() === '') {
      return res.status(400).json({ error: 'Topic or idea prompt is required' });
    }

    // 1. Create DB record in QUEUED state
    const videoGen = await VideoGeneration.create({
      topic,
      duration: Number(duration) || 30,
      style,
      language,
      aspectRatio,
      status: VideoStatus.QUEUED,
      progress: 5,
      currentStep: 'Initializing AI Engine...',
    });

    const videoId = videoGen._id.toString();

    // Respond immediately with created job ID so frontend can connect to SSE stream
    res.status(202).json({
      success: true,
      message: 'Video generation started',
      videoId,
      video: videoGen
    });

    // Run pipeline asynchronously
    (async () => {
      try {
        // Step 1: LLM Scripting
        await VideoGeneration.findByIdAndUpdate(videoId, {
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

        await VideoGeneration.findByIdAndUpdate(videoId, {
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

        // Step 2: Media Asset Pipeline
        await VideoGeneration.findByIdAndUpdate(videoId, {
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

        await VideoGeneration.findByIdAndUpdate(videoId, {
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
        await VideoGeneration.findByIdAndUpdate(videoId, {
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

        await VideoGeneration.findByIdAndUpdate(videoId, {
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
        await VideoGeneration.findByIdAndUpdate(videoId, {
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
        const updatedVideo = await VideoGeneration.findByIdAndUpdate(videoId, {
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
        await VideoGeneration.findByIdAndUpdate(videoId, {
          status: VideoStatus.FAILED,
          errorMessage: pipelineErr.message || 'An error occurred during video rendering'
        });
        progressEmitter.notify(videoId, {
          status: VideoStatus.FAILED,
          error: pipelineErr.message
        });
      }
    })();
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
   * Fetch single video
   */
  static async getVideoById(req, res) {
    try {
      const { id } = req.params;
      const video = await VideoGeneration.findById(id);
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      res.json({ success: true, video });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * List all videos
   */
  static async getAllVideos(req, res) {
    try {
      const videos = await VideoGeneration.find({});
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
