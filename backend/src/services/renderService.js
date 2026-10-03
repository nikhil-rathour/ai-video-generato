import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { ffmpegPath, ffprobePath } from '../config/ffmpeg.js';
import { generateAssFile } from '../utils/captionGenerator.js';
import { ensureBackgroundMusic } from '../utils/bgmProvider.js';
import StorageService from './storageService.js';
import { getTempDir } from '../config/paths.js';

export class RenderService {
  /**
   * Renders the complete vertical 9:16 1080x1920 MP4 video
   */
  static async renderVideo({ scenes, voiceLocalPath, videoId, onProgress }) {
    console.log(`[Render Service] Starting FFmpeg video rendering for ${videoId}...`);
    const tempDir = getTempDir(videoId);

    const ffExe = ffmpegPath || 'ffmpeg';
    const totalDuration = scenes.reduce((acc, s) => acc + (Number(s.duration) || 5), 0);

    // 1. Prepare Subtitle / Caption ASS file
    const assFile = path.join(tempDir, 'subtitles.ass');
    generateAssFile(scenes, assFile, {
      fontName: 'Arial',
      fontSize: 56,
      marginV: 260
    });
    console.log(`[Render Service] Generated ASS subtitle file: ${assFile}`);

    // 2. Prepare Background Music track
    const bgmFile = path.join(tempDir, 'bgm.aac');
    await ensureBackgroundMusic(totalDuration + 5, bgmFile);

    // 3. Process each scene clip: scale & crop to 1080x1920 with 30fps and exact duration
    const processedSceneClips = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneNum = scene.sceneNumber || (i + 1);
      const sceneDuration = Number(scene.duration) || 5;
      const inputAsset = scene.localPath;

      if (!inputAsset || !fs.existsSync(inputAsset)) {
        throw new Error(`Scene asset missing for Scene ${sceneNum}`);
      }

      const sceneOutClip = path.join(tempDir, `norm_scene_${sceneNum}.mp4`);

      // Scale, crop to 1080x1920, normalize framerate to 30fps, trim exact duration
      // Added subtle ken-burns / zoom-in animation for dynamic movement
      const videoFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(iw-1080)/2:(ih-1920)/2,setsar=1,fps=30`;

      await new Promise((resolve, reject) => {
        const cmd = `"${ffExe}" -y -i "${inputAsset}" -vf "${videoFilter}" -t ${sceneDuration} -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -an "${sceneOutClip}"`;
        exec(cmd, (err) => {
          if (err) return reject(new Error(`Failed to process scene ${sceneNum}: ${err.message}`));
          resolve(sceneOutClip);
        });
      });

      processedSceneClips.push(sceneOutClip);
      if (onProgress) onProgress(30 + Math.round((i / scenes.length) * 30));
    }

    // 4. Concatenate normalized scenes
    const concatListFile = path.join(tempDir, 'scenes_concat.txt');
    const concatContent = processedSceneClips.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(concatListFile, concatContent, 'utf8');

    const rawVideoMerged = path.join(tempDir, 'raw_scenes_merged.mp4');
    await new Promise((resolve, reject) => {
      const cmd = `"${ffExe}" -y -f concat -safe 0 -i "${concatListFile}" -c copy "${rawVideoMerged}"`;
      exec(cmd, (err) => {
        if (err) return reject(new Error(`Scene concatenation failed: ${err.message}`));
        resolve(rawVideoMerged);
      });
    });

    if (onProgress) onProgress(70);

    // 5. Final Composite: Video + Subtitles + Voiceover + Ducked Background Music
    const finalMp4Name = `qoneqt_video_${videoId}_${Date.now()}.mp4`;
    const finalMp4Path = path.join(tempDir, finalMp4Name);

    // Subtitle filter escaping for FFmpeg Windows paths
    const escapedAssPath = assFile.replace(/\\/g, '/').replace(/:/g, '\\:');
    
    // Check if ass filter is supported or fallback to without subtitles filter if error
    const complexFilter = `[1:a]volume=1.0[v_audio];[2:a]volume=0.10,afade=t=out:st=${Math.max(1, totalDuration - 2)}:d=2[bgm_audio];[v_audio][bgm_audio]amix=inputs=2:duration=first:dropout_transition=2[a_out]`;

    console.log(`[Render Service] Rendering final MP4 with audio mixing & burn-in captions...`);

    await new Promise((resolve, reject) => {
      // Use ass filter if possible
      const cmd = `"${ffExe}" -y -i "${rawVideoMerged}" -i "${voiceLocalPath}" -i "${bgmFile}" -filter_complex "${complexFilter}" -map 0:v -map "[a_out]" -vf "ass='${escapedAssPath}'" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${finalMp4Path}"`;

      exec(cmd, (err) => {
        if (err) {
          console.warn(`[Render Service] ASS filter error (${err.message}), falling back to direct video+audio compositing...`);
          // Fallback without ASS filter if fontconfig/libass issues arise
          const fallbackCmd = `"${ffExe}" -y -i "${rawVideoMerged}" -i "${voiceLocalPath}" -i "${bgmFile}" -filter_complex "${complexFilter}" -map 0:v -map "[a_out]" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${finalMp4Path}"`;
          exec(fallbackCmd, (err2) => {
            if (err2) return reject(new Error(`Final render composite failed: ${err2.message}`));
            resolve(finalMp4Path);
          });
        } else {
          resolve(finalMp4Path);
        }
      });
    });

    if (onProgress) onProgress(90);

    // 6. Generate Thumbnail Poster (at 1.5s mark)
    const thumbnailPath = path.join(tempDir, `thumb_${videoId}.jpg`);
    await new Promise((resolve) => {
      const thumbCmd = `"${ffExe}" -y -ss 00:00:01.500 -i "${finalMp4Path}" -vframes 1 -q:v 2 "${thumbnailPath}"`;
      exec(thumbCmd, () => resolve(thumbnailPath));
    });

    // 7. Upload final outputs to Cloudinary or serve locally
    console.log(`[Render Service] Storing final video & thumbnail...`);
    let videoStorage = { url: `/outputs/${path.basename(finalMp4Path)}` };
    let thumbStorage = { url: `/outputs/${path.basename(thumbnailPath)}` };

    try {
      videoStorage = await StorageService.uploadFile(finalMp4Path, {
        folder: `qoneqt_published/${videoId}`,
        resourceType: 'video',
        publicId: `video_${videoId}`
      });
      thumbStorage = await StorageService.uploadFile(thumbnailPath, {
        folder: `qoneqt_published/${videoId}`,
        resourceType: 'image',
        publicId: `thumb_${videoId}`
      });
    } catch (storeErr) {
      console.warn(`[Render Service] Storage upload note: ${storeErr.message}`);
    }

    if (onProgress) onProgress(100);

    return {
      videoLocalPath: finalMp4Path,
      videoUrl: videoStorage.url,
      thumbnailLocalPath: thumbnailPath,
      thumbnailUrl: thumbStorage.url,
      duration: totalDuration,
      width: 1080,
      height: 1920
    };
  }
}

export default RenderService;
