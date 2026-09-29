import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isDbConnected, getStore } from '../config/db.js';

export const VideoStatus = {
  QUEUED: 'QUEUED',
  SCRIPTING: 'SCRIPTING',
  COLLECTING_MEDIA: 'COLLECTING_MEDIA',
  GENERATING_VOICE: 'GENERATING_VOICE',
  RENDERING: 'RENDERING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PUBLISHED: 'PUBLISHED',
};

const VideoGenerationSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  hashtags: [{ type: String }],
  style: { type: String, default: 'Educational' },
  language: { type: String, default: 'English' },
  aspectRatio: { type: String, default: '9:16' },
  duration: { type: Number, default: 30 },
  status: { 
    type: String, 
    enum: Object.values(VideoStatus), 
    default: VideoStatus.QUEUED 
  },
  progress: { type: Number, default: 0 },
  currentStep: { type: String, default: 'Initialized' },
  script: { type: mongoose.Schema.Types.Mixed },
  scenes: [{ type: mongoose.Schema.Types.Mixed }],
  voiceUrl: { type: String, default: '' },
  voiceLocalPath: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  videoLocalPath: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  qoneqtPublishId: { type: String, default: '' },
  qoneqtPostUrl: { type: String, default: '' },
  publishedAt: { type: Date },
  errorMessage: { type: String, default: '' },
  llmProvider: { type: String, default: 'Gemini' },
  voiceProvider: { type: String, default: 'ElevenLabs' },
  mediaProvider: { type: String, default: 'Pexels' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MongooseVideoGen = mongoose.model('VideoGeneration', VideoGenerationSchema);

export class VideoGeneration {
  static async find(query = {}) {
    if (isDbConnected()) {
      return await MongooseVideoGen.find(query).sort({ createdAt: -1 });
    }
    const store = getStore();
    return store.videoGenerations.filter(v => {
      for (const k in query) {
        if (v[k] !== query[k]) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    if (isDbConnected()) {
      return await MongooseVideoGen.findById(id);
    }
    const store = getStore();
    return store.videoGenerations.find(v => v._id === id || v.id === id) || null;
  }

  static async create(data) {
    if (isDbConnected()) {
      return await MongooseVideoGen.create(data);
    }
    const store = getStore();
    const newGen = {
      _id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: VideoStatus.QUEUED,
      progress: 0,
      currentStep: 'Initialized',
      scenes: [],
      hashtags: [],
      ...data
    };
    store.videoGenerations.unshift(newGen);
    return newGen;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (isDbConnected()) {
      return await MongooseVideoGen.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    const store = getStore();
    const index = store.videoGenerations.findIndex(v => v._id === id || v.id === id);
    if (index === -1) return null;
    store.videoGenerations[index] = {
      ...store.videoGenerations[index],
      ...update,
      updatedAt: new Date(),
    };
    return store.videoGenerations[index];
  }

  static async deleteOne(query) {
    if (isDbConnected()) {
      return await MongooseVideoGen.deleteOne(query);
    }
    const store = getStore();
    const initialLen = store.videoGenerations.length;
    store.videoGenerations = store.videoGenerations.filter(v => {
      for (const k in query) {
        if (v[k] === query[k] || (k === '_id' && v.id === query[k])) return false;
      }
      return true;
    });
    return { deletedCount: initialLen - store.videoGenerations.length };
  }
}

export default VideoGeneration;
