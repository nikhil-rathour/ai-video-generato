import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, RefreshCw, PlusCircle, Send, Download, Layers, Flame, Lightbulb, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { videoApi, getBaseUrl } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import ProgressBar from '../components/ProgressBar';
import SceneTimeline from '../components/SceneTimeline';
import ScriptViewer from '../components/ScriptViewer';
import QoneqtPublishModal from '../components/QoneqtPublishModal';

export default function Studio({ initialTopic = '' }) {
  const [topic, setTopic] = useState('5 AI tools every developer should know in 2026');
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState('Educational');
  const [language, setLanguage] = useState('English');
  const [aspectRatio, setAspectRatio] = useState('9:16');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [status, setStatus] = useState('IDLE');
  const [error, setError] = useState(null);

  // Publish modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  // Quick Prompt Presets
  const promptPresets = [
    { title: '5 AI tools every developer should know in 2026', tag: 'Trending Tech' },
    { title: '3 Productivity secrets of 10x Software Engineers', tag: 'Productivity' },
    { title: 'Why Multi-Agent Systems will replace standard coding in 2026', tag: 'AI Future' },
    { title: 'How to build your first autonomous full-stack SaaS in one day', tag: 'Tutorial' },
  ];

  // SSE Event Source Listener for real-time progress
  useEffect(() => {
    if (!currentVideoId) return;

    const apiBase = getBaseUrl();
    const sseUrl = `${apiBase}/video/progress/${currentVideoId}`;
    console.log(`[SSE] Subscribing to progress stream at: ${sseUrl}`);
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE Event]', data);

        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.step) {
          setCurrentStep(data.step);
        }
        if (data.status) {
          setStatus(data.status);
        }
        if (data.script) {
          setVideoData(prev => ({ ...(prev || {}), script: data.script, title: data.script.title, hashtags: data.script.hashtags }));
        }
        if (data.scenes) {
          setVideoData(prev => ({ ...(prev || {}), scenes: data.scenes }));
        }
        if (data.video) {
          setVideoData(data.video);
        }
        if (data.status === 'COMPLETED' || data.status === 'PUBLISHED') {
          setIsGenerating(false);
          eventSource.close();
          // Fetch complete record
          videoApi.getById(currentVideoId).then(res => {
            if (res.video) setVideoData(res.video);
          });
        }
        if (data.status === 'FAILED' || data.error) {
          setIsGenerating(false);
          setError(data.error || 'Video generation failed');
          eventSource.close();
        }
      } catch (err) {
        console.error('[SSE Parse Error]', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('[SSE Connection Closed or Reconnecting]');
      // Poll fallback if SSE disconnects
      const pollInterval = setInterval(async () => {
        try {
          const res = await videoApi.getById(currentVideoId);
          if (res.video) {
            setVideoData(res.video);
            setProgress(res.video.progress || 0);
            setStatus(res.video.status);
            setCurrentStep(res.video.currentStep || '');
            if (res.video.status === 'COMPLETED' || res.video.status === 'FAILED') {
              setIsGenerating(false);
              clearInterval(pollInterval);
            }
          }
        } catch {
          // ignore
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    };

    return () => {
      eventSource.close();
    };
  }, [currentVideoId]);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setProgress(5);
    setStatus('QUEUED');
    setCurrentStep('Initializing AI Engine...');
    setError(null);
    setVideoData(null);

    try {
      const response = await videoApi.generate({
        topic,
        duration: Number(duration),
        style,
        language,
        aspectRatio
      });

      if (response.videoId) {
        setCurrentVideoId(response.videoId);
        setVideoData(response.video);
      }
    } catch (err) {
      // If it's a network timeout, the backend may still be running.
      // Don't show failure yet — let the SSE/polling fallback handle it.
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.message?.includes('60000');
      if (isTimeout) {
        console.warn('[Studio] Axios timeout — backend still running, switching to polling mode');
        setCurrentStep('Pipeline running... (checking progress)');
        // Don't stop generating — polling will catch the result
      } else {
        setIsGenerating(false);
        setError(err.response?.data?.error || err.message);
      }
    }
  };

  const handleCreateAnother = () => {
    setVideoData(null);
    setCurrentVideoId(null);
    setProgress(0);
    setStatus('IDLE');
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Studio Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Autonomous Vertical Video Pipeline
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
          Qoneqt AI Video Studio
        </h1>
        <p className="text-sm text-gray-400 mt-1 max-w-2xl">
          Transform raw ideas into viral, ready-to-publish 9:16 vertical videos with multimodal AI scripting, smart stock footage matching, voice synthesis, and FFmpeg rendering.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Creator Control Deck & Storyboard */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Creator Configuration Card */}
          <div className="glass-panel rounded-3xl p-6 border border-gray-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Topic / Idea Input */}
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-gray-200 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Topic / Idea / Trend
                  </span>
                  <span className="text-gray-400 font-normal">What should this video be about?</span>
                </label>
                <div className="relative">
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={3}
                    placeholder="e.g. 5 AI tools every developer should know in 2026"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-900/80 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm leading-relaxed"
                  />
                </div>

                {/* Prompt Presets */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-pink-400" />
                    Quick Presets:
                  </span>
                  {promptPresets.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTopic(preset.title)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 transition truncate max-w-[240px]"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings Selectors Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {/* Duration */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={30}>30 sec (Fast/Viral)</option>
                    <option value={45}>45 sec (Deep Dive)</option>
                    <option value={60}>60 sec (Full Story)</option>
                  </select>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Educational">Educational</option>
                    <option value="News">News / Tech Update</option>
                    <option value="Viral">Viral High-Energy</option>
                    <option value="Storytelling">Storytelling</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Hindi">Hindi</option>
                    <option value="German">German</option>
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="9:16">9:16 (Vertical Feed)</option>
                  </select>
                </div>
              </div>

              {/* Generate Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating || !topic.trim()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-display font-extrabold text-sm tracking-wide shadow-xl shadow-purple-600/30 hover:opacity-95 hover:shadow-purple-600/50 transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Wand2 className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'AI ENGINE PRODUCING VIDEO...' : 'GENERATE VIDEO'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Real-time Progress Pipeline Tracker */}
          {(isGenerating || status === 'COMPLETED' || error) && (
            <ProgressBar
              status={status}
              progress={progress}
              currentStep={currentStep}
              error={error}
            />
          )}

          {/* Structured Script Blueprint */}
          {videoData?.script && (
            <ScriptViewer
              script={videoData.script}
              title={videoData.title}
              description={videoData.description}
              hashtags={videoData.hashtags}
              llmProvider={videoData.llmProvider}
            />
          )}

          {/* Scene Storyboard Timeline */}
          {videoData?.scenes && videoData.scenes.length > 0 && (
            <SceneTimeline scenes={videoData.scenes} />
          )}

        </div>

        {/* Right Column: 9:16 Vertical Video Preview & Social Actions */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="glass-panel rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-extrabold text-white">Live Video Preview</h3>
                <p className="text-[11px] text-gray-400">1080x1920 MP4 &bull; 9:16 Vertical Display</p>
              </div>

              {videoData?.status === 'COMPLETED' && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Rendered
                </span>
              )}
            </div>

            {/* Vertical Player Component */}
            <VideoPlayer
              videoUrl={videoData?.videoUrl}
              thumbnailUrl={videoData?.thumbnailUrl}
              title={videoData?.title || topic}
              hashtags={videoData?.hashtags}
              author="@qoneqt_creator"
            />

            {/* Post-Generation Action Buttons */}
            {videoData?.videoUrl && (
              <div className="w-full max-w-[360px] mt-6 space-y-2.5">
                
                {/* Publish to Qoneqt */}
                <button
                  onClick={() => setIsPublishModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-pink-600/30 hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish to Qoneqt Global Feed</span>
                </button>

                {/* Secondary Actions Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                    <span>Regenerate</span>
                  </button>

                  <button
                    onClick={handleCreateAnother}
                    className="py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Create Another</span>
                  </button>
                </div>

                {/* Video Info Summary */}
                <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800/80 text-[11px] text-gray-400 space-y-1 mt-3">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="text-gray-200 font-mono">{videoData.duration || duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolution:</span>
                    <span className="text-gray-200 font-mono">1080 &times; 1920 (9:16)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LLM Engine:</span>
                    <span className="text-gray-200">{videoData.llmProvider || 'Gemini'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Voice Provider:</span>
                    <span className="text-gray-200">{videoData.voiceProvider || 'ElevenLabs'}</span>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Qoneqt Publish Modal */}
      {videoData && (
        <QoneqtPublishModal
          video={videoData}
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onPublished={(updated) => {
            setVideoData(updated);
          }}
        />
      )}
    </div>
  );
}
