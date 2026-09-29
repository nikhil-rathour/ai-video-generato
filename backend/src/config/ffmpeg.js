import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

let ffmpegPath = null;
let ffprobePath = null;

// 1. Try system ffmpeg
try {
  const sysFfmpeg = execSync('where.exe ffmpeg', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim().split('\r\n')[0];
  if (sysFfmpeg && fs.existsSync(sysFfmpeg)) {
    ffmpegPath = sysFfmpeg;
  }
} catch {
  // Not in PATH yet
}

// 2. Check Gyan.FFmpeg standard install paths on Windows
if (!ffmpegPath) {
  const gyanPaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe'),
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\ffmpeg\\bin\\ffmpeg.exe'
  ];
  for (const gp of gyanPaths) {
    if (fs.existsSync(gp)) {
      // Find ffmpeg.exe inside directory recursively if needed
      if (gp.endsWith('.exe')) {
        ffmpegPath = gp;
        break;
      } else {
        const findExe = (dir) => {
          const files = fs.readdirSync(dir);
          for (const f of files) {
            const full = path.join(dir, f);
            if (fs.statSync(full).isDirectory()) {
              const res = findExe(full);
              if (res) return res;
            } else if (f.toLowerCase() === 'ffmpeg.exe') {
              return full;
            }
          }
          return null;
        };
        const found = findExe(gp);
        if (found) {
          ffmpegPath = found;
          break;
        }
      }
    }
  }
}

// 3. Fallback to @ffmpeg-installer
if (!ffmpegPath && ffmpegInstaller?.path) {
  ffmpegPath = ffmpegInstaller.path;
}

// Same for ffprobe
try {
  const sysFfprobe = execSync('where.exe ffprobe', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim().split('\r\n')[0];
  if (sysFfprobe && fs.existsSync(sysFfprobe)) {
    ffprobePath = sysFfprobe;
  }
} catch {
  // Not in PATH
}

if (!ffprobePath && ffmpegPath) {
  const candidate = path.join(path.dirname(ffmpegPath), 'ffprobe.exe');
  if (fs.existsSync(candidate)) {
    ffprobePath = candidate;
  }
}

if (!ffprobePath && ffprobeInstaller?.path) {
  ffprobePath = ffprobeInstaller.path;
}

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
  console.log(`[FFmpeg Config] Using FFmpeg from: ${ffmpegPath}`);
} else {
  console.warn(`[FFmpeg Config] FFmpeg executable not detected automatically.`);
}

if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath);
  console.log(`[FFmpeg Config] Using FFprobe from: ${ffprobePath}`);
}

export { ffmpeg, ffmpegPath, ffprobePath };
export default ffmpeg;
