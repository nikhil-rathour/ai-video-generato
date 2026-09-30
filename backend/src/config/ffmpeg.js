import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { isVercel } from './paths.js';

let ffmpegPath = null;
let ffprobePath = null;

// Dynamically load installers inside try/catch so missing binaries on Vercel never crash the app
let ffmpegInstaller = null;
let ffprobeInstaller = null;

try {
  const mod = await import('@ffmpeg-installer/ffmpeg');
  ffmpegInstaller = mod.default || mod;
} catch (e) {
  console.warn('[FFmpeg Config] @ffmpeg-installer package failed to load:', e.message || e);
}

try {
  const mod = await import('@ffprobe-installer/ffprobe');
  ffprobeInstaller = mod.default || mod;
} catch (e) {
  console.warn('[FFmpeg Config] @ffprobe-installer package failed to load:', e.message || e);
}

// 1. On local environment: check system ffmpeg and local paths
if (!isVercel) {
  try {
    const cmd = process.platform === 'win32' ? 'where.exe ffmpeg' : 'which ffmpeg';
    const sysFfmpeg = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim().split(/\r?\n/)[0];
    if (sysFfmpeg && fs.existsSync(sysFfmpeg)) {
      ffmpegPath = sysFfmpeg;
    }
  } catch {
    // Not in PATH
  }

  // Check Gyan.FFmpeg standard install paths on Windows
  if (!ffmpegPath) {
    const gyanPaths = [
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe'),
      'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
      'C:\\ffmpeg\\bin\\ffmpeg.exe'
    ];
    for (const gp of gyanPaths) {
      try {
        if (fs.existsSync(gp)) {
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
            if (found) { ffmpegPath = found; break; }
          }
        }
      } catch { /* skip unreadable path */ }
    }
  }

  // ffprobe system lookup
  try {
    const cmd2 = process.platform === 'win32' ? 'where.exe ffprobe' : 'which ffprobe';
    const sysFfprobe = execSync(cmd2, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim().split(/\r?\n/)[0];
    if (sysFfprobe && fs.existsSync(sysFfprobe)) {
      ffprobePath = sysFfprobe;
    }
  } catch {
    // Not in PATH
  }

  if (!ffprobePath && ffmpegPath) {
    const ext = process.platform === 'win32' ? '.exe' : '';
    const candidate = path.join(path.dirname(ffmpegPath), `ffprobe${ext}`);
    try {
      if (fs.existsSync(candidate)) ffprobePath = candidate;
    } catch { /* ignore */ }
  }
}

// 2. Fallback to @ffmpeg-installer / @ffprobe-installer
if (!ffmpegPath && ffmpegInstaller?.path) {
  try {
    if (fs.existsSync(ffmpegInstaller.path)) {
      ffmpegPath = ffmpegInstaller.path;
    }
  } catch { /* ignore */ }
}

if (!ffprobePath && ffprobeInstaller?.path) {
  try {
    if (fs.existsSync(ffprobeInstaller.path)) {
      ffprobePath = ffprobeInstaller.path;
    }
  } catch { /* ignore */ }
}

if (ffmpegPath) {
  try {
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log(`[FFmpeg Config] Using FFmpeg from: ${ffmpegPath}`);
  } catch (e) {
    console.warn(`[FFmpeg Config] Could not set ffmpeg path: ${e.message}`);
  }
} else {
  console.warn('[FFmpeg Config] FFmpeg executable not detected automatically.');
}

if (ffprobePath) {
  try {
    ffmpeg.setFfprobePath(ffprobePath);
    console.log(`[FFmpeg Config] Using FFprobe from: ${ffprobePath}`);
  } catch (e) {
    console.warn(`[FFmpeg Config] Could not set ffprobe path: ${e.message}`);
  }
}

export { ffmpeg, ffmpegPath, ffprobePath };
export default ffmpeg;
