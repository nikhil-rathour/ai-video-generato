import VideoGeneration, { VideoStatus } from '../models/VideoGeneration.js';
import QoneqtService from '../services/qoneqtService.js';

export class QoneqtController {
  /**
   * Publishes video to Qoneqt Global Feed
   */
  static async publishVideo(req, res) {
    try {
      const { videoId, title, description, tags, customCaption } = req.body;

      if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
      }

      const video = await VideoGeneration.findById(videoId);
      if (!video) {
        return res.status(404).json({ error: 'Video record not found' });
      }

      if (video.status !== VideoStatus.COMPLETED && video.status !== VideoStatus.PUBLISHED) {
        return res.status(400).json({ error: 'Video must be COMPLETED before publishing to Qoneqt' });
      }

      const publishResult = await QoneqtService.publishVideo({
        title: title || video.title,
        description: customCaption || description || video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        tags: tags || video.hashtags,
        duration: video.duration,
        aspectRatio: video.aspectRatio || '9:16'
      });

      // Update video record
      await VideoGeneration.findByIdAndUpdate(videoId, {
        status: VideoStatus.PUBLISHED,
        qoneqtPublishId: publishResult.postId,
        qoneqtPostUrl: publishResult.feedUrl,
        publishedAt: publishResult.publishedAt,
      });

      res.json({
        success: true,
        publishResult,
        video: await VideoGeneration.findById(videoId)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Status check for a published post
   */
  static async getPublishStatus(req, res) {
    try {
      const { id } = req.params;
      const status = await QoneqtService.getPublishStatus(id);
      res.json({ success: true, status });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default QoneqtController;
