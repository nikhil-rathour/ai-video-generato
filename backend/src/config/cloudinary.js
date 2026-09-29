import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(
  cloudName && 
  apiKey && 
  apiSecret && 
  cloudName !== 'YOUR_CLOUDINARY_CLOUD_NAME' &&
  apiKey !== 'YOUR_CLOUDINARY_API_KEY'
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log(`[Cloudinary Config] Configured for cloud: ${cloudName}`);
} else {
  console.log('[Cloudinary Config] Keys not set or placeholder detected. Operating in local storage mode.');
}

export const isCloudinaryActive = () => isConfigured;
export { cloudinary };
export default cloudinary;
