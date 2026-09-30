import mongoose from 'mongoose';

const SceneSchema = new mongoose.Schema({
  videoId:      { type: String, required: true },
  sceneNumber:  { type: Number, required: true },
  duration:     { type: Number, required: true },
  voiceover:    { type: String, required: true },
  visualQuery:  { type: String, required: true },
  visualPrompt: { type: String },
  onScreenText: { type: String },
  transition:   { type: String, default: 'fade' },
  mediaAssetId: { type: String },
  mediaUrl:     { type: String },
  mediaType:    { type: String, default: 'video' },
}, {
  timestamps: true,
});

const Scene = mongoose.model('Scene', SceneSchema);

export default Scene;
