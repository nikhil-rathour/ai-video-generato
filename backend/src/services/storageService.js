import fs from 'fs';
import path from 'path';
import { cloudinary, isCloudinaryActive } from '../config/cloudinary.js';
import { getPublicOutputsDir } from '../config/paths.js';

export class StorageService {
  /**
   * Uploads a file to Cloudinary if configured; otherwise serves locally.
   * On Vercel (no persistent disk), Cloudinary is strongly recommended.
   */
  static async uploadFile(filePath, options = {}) {
    const {
      folder = 'qoneqt_studio',
      resourceType = 'auto', // 'video', 'image', 'raw'
      publicId = undefined,
    } = options;

    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const fileName = path.basename(filePath);

    if (isCloudinaryActive()) {
      try {
        console.log(`[Storage] Uploading ${fileName} to Cloudinary...`);
        const result = await cloudinary.uploader.upload(filePath, {
          folder,
          resource_type: resourceType,
          public_id: publicId,
          overwrite: true,
        });
        console.log(`[Storage] Cloudinary upload success: ${result.secure_url}`);
        return {
          provider: 'cloudinary',
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
        };
      } catch (error) {
        console.warn(`[Storage] Cloudinary upload failed (${error.message}). Falling back to local static URL.`);
      }
    }

    // Local serving fallback (not suitable for Vercel production — configure Cloudinary)
    const publicOutputDir = getPublicOutputsDir();
    const destPath = path.join(publicOutputDir, fileName);
    if (filePath !== destPath) {
      fs.copyFileSync(filePath, destPath);
    }

    const port = process.env.PORT || 5000;
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
    const relativePath = `/outputs/${fileName}`;
    const fullUrl = `${baseUrl}${relativePath}`;

    return {
      provider: 'local',
      url: fullUrl,
      relativePath,
      localPath: filePath,
    };
  }
}

export default StorageService;
