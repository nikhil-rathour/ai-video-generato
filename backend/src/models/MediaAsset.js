import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isDbConnected, getStore } from '../config/db.js';

const MediaAssetSchema = new mongoose.Schema({
  sceneId: { type: String },
  videoId: { type: String, required: true },
  source: { type: String, enum: ['pexels', 'pixabay', 'procedural', 'custom'], default: 'pexels' },
  mediaType: { type: String, enum: ['video', 'image', 'audio'], default: 'video' },
  url: { type: String, required: true },
  localPath: { type: String },
  cloudinaryUrl: { type: String },
  duration: { type: Number, default: 5 },
  width: { type: Number },
  height: { type: Number },
  photographer: { type: String },
  query: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const MongooseMediaAsset = mongoose.model('MediaAsset', MediaAssetSchema);

export class MediaAsset {
  static async find(query = {}) {
    if (isDbConnected()) {
      return await MongooseMediaAsset.find(query);
    }
    const store = getStore();
    return store.mediaAssets.filter(item => {
      for (const k in query) {
        if (item[k] !== query[k]) return false;
      }
      return true;
    });
  }

  static async create(data) {
    if (isDbConnected()) {
      return await MongooseMediaAsset.create(data);
    }
    const store = getStore();
    const newAsset = {
      _id: uuidv4(),
      createdAt: new Date(),
      ...data
    };
    store.mediaAssets.push(newAsset);
    return newAsset;
  }
}

export default MediaAsset;
