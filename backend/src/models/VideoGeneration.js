import mongoose from 'mongoose';

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
  topic:            { type: String, required: true },
  title:            { type: String, default: '' },
  description:      { type: String, default: '' },
  hashtags:         [{ type: String }],
  style:            { type: String, default: 'Educational' },
  language:         { type: String, default: 'English' },
  aspectRatio:      { type: String, default: '9:16' },
  duration:         { type: Number, default: 30 },
  status:           { type: String, enum: Object.values(VideoStatus), default: VideoStatus.QUEUED },
  progress:         { type: Number, default: 0 },
  currentStep:      { type: String, default: 'Initialized' },
  script:           { type: mongoose.Schema.Types.Mixed },
  scenes:           [{ type: mongoose.Schema.Types.Mixed }],
  voiceUrl:         { type: String, default: '' },
  voiceLocalPath:   { type: String, default: '' },
  videoUrl:         { type: String, default: '' },
  videoLocalPath:   { type: String, default: '' },
  thumbnailUrl:     { type: String, default: '' },
  qoneqtPublishId:  { type: String, default: '' },
  qoneqtPostUrl:    { type: String, default: '' },
  publishedAt:      { type: Date },
  errorMessage:     { type: String, default: '' },
  llmProvider:      { type: String, default: 'Gemini' },
  voiceProvider:    { type: String, default: 'ElevenLabs' },
  mediaProvider:    { type: String, default: 'Pexels' },
}, {
  timestamps: true, // adds createdAt & updatedAt automatically
  bufferCommands: false, // Prevents queries from hanging indefinitely if DB is disconnected
});

const VideoGeneration = mongoose.model('VideoGeneration', VideoGenerationSchema);

export default VideoGeneration;
