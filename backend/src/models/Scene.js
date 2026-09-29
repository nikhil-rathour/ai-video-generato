import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isDbConnected, getStore } from '../config/db.js';

const SceneSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  sceneNumber: { type: Number, required: true },
  duration: { type: Number, required: true },
  voiceover: { type: String, required: true },
  visualQuery: { type: String, required: true },
  visualPrompt: { type: String },
  onScreenText: { type: String },
  transition: { type: String, default: 'fade' },
  mediaAssetId: { type: String },
  mediaUrl: { type: String },
  mediaType: { type: String, default: 'video' },
  createdAt: { type: Date, default: Date.now },
});

const MongooseScene = mongoose.model('Scene', SceneSchema);

export class Scene {
  static async find(query = {}) {
    if (isDbConnected()) {
      return await MongooseScene.find(query).sort({ sceneNumber: 1 });
    }
    const store = getStore();
    return store.scenes.filter(s => {
      for (const k in query) {
        if (s[k] !== query[k]) return false;
      }
      return true;
    }).sort((a, b) => a.sceneNumber - b.sceneNumber);
  }

  static async create(data) {
    if (isDbConnected()) {
      return await MongooseScene.create(data);
    }
    const store = getStore();
    const newScene = {
      _id: uuidv4(),
      createdAt: new Date(),
      ...data
    };
    store.scenes.push(newScene);
    return newScene;
  }
}

export default Scene;
