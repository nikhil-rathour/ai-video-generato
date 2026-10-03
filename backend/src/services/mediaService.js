import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { ffmpegPath } from '../config/ffmpeg.js';
import StorageService from './storageService.js';
import MediaAsset from '../models/MediaAsset.js';
import { getTempDir } from '../config/paths.js';

export class MediaService {
  /**
   * Fetches or generates visual assets for all scenes in the script
   */
  static async collectSceneAssets(scenes, videoId) {
    console.log(`[Media Service] Collecting visual assets for ${scenes.length} scenes...`);
    const tempDir = getTempDir(videoId);

    // Fetch all scene media in parallel to drastically reduce pipeline duration
    const collectedAssets = await Promise.all(
      scenes.map(scene => this.getMediaForScene(scene, videoId, tempDir))
    );

    return collectedAssets;
  }

  /**
   * Gets media for a single scene with Pexels -> Pixabay -> Procedural fallback
   */
  static async getMediaForScene(scene, videoId, tempDir) {
    const query = scene.visualQuery || 'modern technology developer code';
    const sceneNum = scene.sceneNumber || 1;
    const duration = scene.duration || 5;

    console.log(`[Media Service] Scene ${sceneNum}: Searching media for "${query}"...`);

    let mediaInfo = null;

    // 1. Try Pexels Video Search
    const pexelsKey = process.env.PEXELS_API_KEY;
    if (pexelsKey && pexelsKey !== 'YOUR_PEXELS_API_KEY' && pexelsKey.trim() !== '') {
      try {
        const pexelsRes = await axios.get('https://api.pexels.com/videos/search', {
          params: {
            query: query,
            orientation: 'portrait',
            per_page: 5,
            size: 'medium'
          },
          headers: { Authorization: pexelsKey },
          timeout: 8000
        });

        if (pexelsRes.data?.videos?.length > 0) {
          const videoObj = pexelsRes.data.videos[0];
          // Find best vertical HD or SD video file
          const videoFile = videoObj.video_files.find(f => f.width && f.height && f.height >= f.width && f.quality === 'hd') ||
                            videoObj.video_files.find(f => f.quality === 'sd') ||
                            videoObj.video_files[0];

          if (videoFile?.link) {
            mediaInfo = {
              source: 'pexels',
              mediaType: 'video',
              downloadUrl: videoFile.link,
              photographer: videoObj.user?.name || 'Pexels Creator',
              width: videoFile.width,
              height: videoFile.height,
              query
            };
          }
        }
      } catch (err) {
        console.warn(`[Media Service] Pexels search failed (${err.message}). Trying Pixabay fallback...`);
      }
    }

    // 2. Try Pixabay Fallback
    if (!mediaInfo) {
      const pixabayKey = process.env.PIXABAY_API_KEY;
      if (pixabayKey && pixabayKey !== 'YOUR_PIXABAY_API_KEY' && pixabayKey.trim() !== '') {
        try {
          const pixabayRes = await axios.get('https://pixabay.com/api/videos/', {
            params: {
              key: pixabayKey,
              q: encodeURIComponent(query.slice(0, 50)),
              video_type: 'film',
              per_page: 5
            },
            timeout: 8000
          });

          if (pixabayRes.data?.hits?.length > 0) {
            const hit = pixabayRes.data.hits[0];
            const videoFile = hit.videos?.medium || hit.videos?.small || hit.videos?.large;
            if (videoFile?.url) {
              mediaInfo = {
                source: 'pixabay',
                mediaType: 'video',
                downloadUrl: videoFile.url,
                photographer: hit.user || 'Pixabay Creator',
                width: videoFile.width,
                height: videoFile.height,
                query
              };
            }
          }
        } catch (err) {
          console.warn(`[Media Service] Pixabay search failed: ${err.message}`);
        }
      }
    }

    // 3. Download remote asset or generate high-aesthetic procedural background
    const localFileName = `scene_${sceneNum}_${uuidv4().slice(0, 8)}.mp4`;
    const localFilePath = path.join(tempDir, localFileName);

    if (mediaInfo?.downloadUrl) {
      try {
        console.log(`[Media Service] Downloading ${mediaInfo.source} video for Scene ${sceneNum}...`);
        await this.downloadFile(mediaInfo.downloadUrl, localFilePath);
        mediaInfo.localPath = localFilePath;
      } catch (downloadErr) {
        console.warn(`[Media Service] Download failed (${downloadErr.message}). Generating high-tech procedural video.`);
        mediaInfo = null;
      }
    }

    // 4. Procedural generator fallback (guaranteed vertical 1080x1920 video with cyber tech visuals)
    if (!mediaInfo) {
      console.log(`[Media Service] Generating procedural 1080x1920 visual for Scene ${sceneNum} ("${query}")...`);
      await this.generateProceduralVideo(sceneNum, duration, query, localFilePath);
      mediaInfo = {
        source: 'procedural',
        mediaType: 'video',
        downloadUrl: 'generated://procedural',
        localPath: localFilePath,
        photographer: 'Qoneqt AI Visual Engine',
        width: 1080,
        height: 1920,
        query
      };
    }

    // 5. Upload asset to Cloudinary or serve locally
    let storageResult = { url: `/outputs/${path.basename(localFilePath)}` };
    try {
      storageResult = await StorageService.uploadFile(localFilePath, {
        folder: `qoneqt_videos/${videoId}`,
        resourceType: 'video',
        publicId: `scene_${sceneNum}_${Date.now()}`
      });
    } catch (storeErr) {
      console.warn(`[Media Service] Cloud storage upload note: ${storeErr.message}`);
    }

    // Save asset record
    const assetRecord = await MediaAsset.create({
      videoId,
      sceneId: scene._id || `scene_${sceneNum}`,
      source: mediaInfo.source,
      mediaType: mediaInfo.mediaType,
      url: mediaInfo.downloadUrl,
      localPath: mediaInfo.localPath,
      cloudinaryUrl: storageResult.url,
      duration,
      width: mediaInfo.width,
      height: mediaInfo.height,
      photographer: mediaInfo.photographer,
      query
    });

    return {
      ...scene,
      mediaAssetId: assetRecord._id,
      mediaUrl: storageResult.url,
      localPath: mediaInfo.localPath,
      source: mediaInfo.source,
      photographer: mediaInfo.photographer
    };
  }

  /**
   * Downloads a remote file to a local destination stream
   */
  static async downloadFile(url, destPath) {
    const writer = fs.createWriteStream(destPath);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 25000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  /**
   * Generates a sleek, animated 1080x1920 cyber/tech vertical background video
   */
  static async generateProceduralVideo(sceneNum, duration = 5, query = '', outputPath) {
    const ffExe = ffmpegPath || 'ffmpeg';

    // Different vibrant color schemes & geometric cyber visual generators per scene
    const visualStyles = [
      // Cyber Neon Gradient Flow
      `gradients=s=1080x1920:d=${duration}:c0=0x0B0F19:c1=0x6366F1:c2=0xEC4899:x0=540:y0=960:speed=0.5,drawgrid=w=120:h=120:t=2:c=white@0.08`,
      // Deep Purple Grid & Radiant Wave
      `gradients=s=1080x1920:d=${duration}:c0=0x1E1B4B:c1=0x8B5CF6:c2=0x06B6D4:x0=540:y0=400:speed=0.7,drawgrid=w=90:h=90:t=2:c=cyan@0.12`,
      // Dark Emerald Tech Matrix Flow
      `gradients=s=1080x1920:d=${duration}:c0=0x064E3B:c1=0x10B981:c2=0x0F172A:x0=200:y0=1400:speed=0.6,drawgrid=w=100:h=100:t=2:c=green@0.10`,
      // Sunset Amber & Electric Blue Pulse
      `gradients=s=1080x1920:d=${duration}:c0=0x7C2D12:c1=0xF59E0B:c2=0x3B82F6:x0=800:y0=800:speed=0.8,drawgrid=w=110:h=110:t=2:c=yellow@0.09`
    ];

    const filter = visualStyles[(sceneNum - 1) % visualStyles.length];

    const cmd = `"${ffExe}" -y -f lavfi -i "${filter}" -c:v libx264 -pix_fmt yuv420p -t ${duration} -r 30 "${outputPath}"`;

    return new Promise((resolve, reject) => {
      exec(cmd, (err) => {
        if (err) {
          console.warn('[Media Service] Advanced procedural generation failed, using color canvas fallback:', err.message);
          // Ultra basic color canvas fallback
          const basicCmd = `"${ffExe}" -y -f lavfi -i "color=c=0x111827:s=1080x1920:d=${duration}" -c:v libx264 -pix_fmt yuv420p -t ${duration} -r 30 "${outputPath}"`;
          exec(basicCmd, (err2) => {
            if (err2) return reject(err2);
            resolve(outputPath);
          });
        } else {
          resolve(outputPath);
        }
      });
    });
  }
}

export default MediaService;
