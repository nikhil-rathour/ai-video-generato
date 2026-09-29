import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { ffmpegPath } from '../config/ffmpeg.js';

/**
 * Generates an ambient lofi / electronic background music loop using FFmpeg audio synthesis
 * if no external audio track is present.
 */
export async function ensureBackgroundMusic(duration = 60, outputPath) {
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
    return outputPath;
  }

  return new Promise((resolve, reject) => {
    const ffExe = ffmpegPath || 'ffmpeg';
    // Generate soft, rhythmic synth lofi chords with binaural beats & warm lowpass filter
    const filter = `aevalsrc=exprs='0.08*sin(2*PI*220*t)*sin(2*PI*2*t) + 0.05*sin(2*PI*330*t) + 0.04*sin(2*PI*440*t) + 0.03*white_noise(t)':s=44100:d=${duration},lowpass=f=1200,volume=0.3`;

    const cmd = `"${ffExe}" -y -f lavfi -i "${filter}" -c:a aac -b:a 128k "${outputPath}"`;

    exec(cmd, (err) => {
      if (err) {
        console.warn('[BGM Provider] Synth BGM generation note:', err.message);
        // Fallback: simple silent audio or mild sine
        const simpleCmd = `"${ffExe}" -y -f lavfi -i "sine=frequency=220:duration=${duration}" -af "volume=0.03" -c:a aac "${outputPath}"`;
        exec(simpleCmd, (err2) => {
          if (err2) return reject(err2);
          resolve(outputPath);
        });
      } else {
        resolve(outputPath);
      }
    });
  });
}
