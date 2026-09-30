import os from 'os';
import path from 'path';
import fs from 'fs';

export const isVercel = !!process.env.VERCEL;

/**
 * Returns a safe, writable temporary directory for video generation chunks,
 * audio files, and intermediate ffmpeg render files.
 */
export const getTempDir = (sub = '') => {
  const base = isVercel ? path.join(os.tmpdir(), 'qoneqt_temp') : path.resolve('temp');
  const target = sub ? path.join(base, sub) : base;
  if (!fs.existsSync(target)) {
    try {
      fs.mkdirSync(target, { recursive: true });
    } catch (e) {
      console.warn(`[Paths] Could not create temp dir ${target}:`, e.message);
    }
  }
  return target;
};

/**
 * Returns a safe directory for output files
 */
export const getPublicOutputsDir = () => {
  const base = isVercel ? path.join(os.tmpdir(), 'qoneqt_outputs') : path.resolve('public', 'outputs');
  if (!fs.existsSync(base)) {
    try {
      fs.mkdirSync(base, { recursive: true });
    } catch (e) {
      console.warn(`[Paths] Could not create outputs dir ${base}:`, e.message);
    }
  }
  return base;
};

/**
 * Returns a safe directory for upload files
 */
export const getPublicUploadsDir = () => {
  const base = isVercel ? path.join(os.tmpdir(), 'qoneqt_uploads') : path.resolve('public', 'uploads');
  if (!fs.existsSync(base)) {
    try {
      fs.mkdirSync(base, { recursive: true });
    } catch (e) {
      console.warn(`[Paths] Could not create uploads dir ${base}:`, e.message);
    }
  }
  return base;
};
