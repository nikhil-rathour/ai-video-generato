import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class QoneqtService {
  /**
   * Checks if live Qoneqt production API credentials are configured
   */
  static isLiveConfigured() {
    const apiKey = process.env.QONEQT_API_KEY;
    const apiUrl = process.env.QONEQT_API_URL;
    return Boolean(
      apiKey &&
      apiUrl &&
      apiKey !== 'YOUR_QONEQT_API_KEY' &&
      apiUrl !== 'YOUR_QONEQT_API_URL' &&
      apiKey.trim() !== ''
    );
  }

  /**
   * Publishes a completed video to the Qoneqt Global Feed
   */
  static async publishVideo({ title, description, videoUrl, thumbnailUrl, tags = [], duration = 30, aspectRatio = '9:16' }) {
    const isLive = this.isLiveConfigured();
    const apiUrl = process.env.QONEQT_API_URL || 'https://api.qoneqt.com/v1';
    const apiKey = process.env.QONEQT_API_KEY || '';

    const payload = {
      title,
      description: description || title,
      videoUrl,
      thumbnailUrl,
      tags: Array.isArray(tags) ? tags : [tags],
      category: 'Technology & AI',
      aspectRatio,
      duration,
      publishedAt: new Date().toISOString(),
      visibility: 'public',
      channel: 'Qoneqt Global Feed'
    };

    if (isLive) {
      console.log(`[Qoneqt Service] Publishing video to Live Qoneqt API: ${apiUrl}/feed/posts...`);
      try {
        const response = await axios.post(`${apiUrl}/feed/posts`, payload, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Qoneqt-Client': 'Qoneqt-AI-Video-Studio/1.0'
          },
          timeout: 15000
        });

        return {
          status: 'PUBLISHED_LIVE',
          isLive: true,
          mode: 'production',
          postId: response.data?.id || response.data?.postId || uuidv4(),
          feedUrl: response.data?.postUrl || `${apiUrl}/feed/${response.data?.id || 'post'}`,
          message: 'Video published successfully to the live Qoneqt Global Feed!',
          response: response.data,
          publishedAt: new Date()
        };
      } catch (err) {
        console.error(`[Qoneqt Service] Live publishing failed (${err.message}). Returning error payload.`);
        throw new Error(`Qoneqt API Error: ${err.response?.data?.message || err.message}`);
      }
    } else {
      // CLEARLY MARKED DEMO / SANDBOX MODE
      console.log('[Qoneqt Service] Operating in Demo/Sandbox Mode (QONEQT_API_KEY not configured in .env).');
      const demoPostId = `qoneqt_demo_${uuidv4().slice(0, 10)}`;
      
      return {
        status: 'DEMO_READY_FOR_PUBLISHING',
        isLive: false,
        mode: 'demo_sandbox',
        postId: demoPostId,
        feedUrl: `https://qoneqt.com/feed/demo/${demoPostId}`,
        message: 'Video prepared in Qoneqt Integration Layer (Demo Mode). Set QONEQT_API_KEY & QONEQT_API_URL in .env to publish directly to live feed.',
        payloadPreview: payload,
        publishedAt: new Date()
      };
    }
  }

  /**
   * Retrieves publishing status from Qoneqt
   */
  static async getPublishStatus(postId) {
    const isLive = this.isLiveConfigured();
    const apiUrl = process.env.QONEQT_API_URL || 'https://api.qoneqt.com/v1';
    const apiKey = process.env.QONEQT_API_KEY || '';

    if (isLive) {
      try {
        const response = await axios.get(`${apiUrl}/feed/posts/${postId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: 8000
        });
        return {
          status: 'ACTIVE',
          isLive: true,
          data: response.data
        };
      } catch (err) {
        return {
          status: 'ERROR',
          isLive: true,
          error: err.response?.data?.message || err.message
        };
      }
    }

    return {
      status: 'DEMO_ACTIVE',
      isLive: false,
      postId,
      views: 1420,
      likes: 184,
      shares: 42,
      note: 'Simulated metrics in Demo/Sandbox mode'
    };
  }
}

export default QoneqtService;
