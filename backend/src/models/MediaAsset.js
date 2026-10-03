import mongoose from 'mongoose';

const MediaAssetSchema = new mongoose.Schema({
  sceneId:       { type: String },
  videoId:       { type: String, required: true },
  source:        { type: String, enum: ['pexels', 'pixabay', 'procedural', 'custom'], default: 'pexels' },
  mediaType:     { type: String, enum: ['video', 'image', 'audio'], default: 'video' },
  url:           { type: String, required: true },
  localPath:     { type: String },
  cloudinaryUrl: { type: String },
  duration:      { type: Number, default: 5 },
  width:         { type: Number },
  height:        { type: Number },
  photographer:  { type: String },
  query:         { type: String },
}, {
  timestamps: true,
  bufferCommands: false,
});

const MediaAsset = mongoose.model('MediaAsset', MediaAssetSchema);

export default MediaAsset;
