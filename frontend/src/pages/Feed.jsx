import React, { useState, useEffect } from 'react';
import { Radio, Heart, MessageCircle, Share2, Sparkles, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import { videoApi } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';

export default function Feed({ onSelectVideoForStudio }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await videoApi.getAll();
      const publishedOrCompleted = (res.videos || []).filter(v => v.videoUrl);
      setVideos(publishedOrCompleted);
    } catch (err) {
      console.error('Failed to load feed videos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">
              Live Network
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white">
            Qoneqt Global Feed
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Explore ready-to-publish and broadcasted vertical video content across the creator ecosystem.
          </p>
        </div>

        <button
          onClick={fetchVideos}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-semibold text-gray-200 transition self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading Qoneqt Global Feed...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto border border-gray-800">
          <Radio className="w-12 h-12 mx-auto mb-4 text-purple-400 opacity-60" />
          <h3 className="text-lg font-bold text-white mb-1">No Videos in Feed Yet</h3>
          <p className="text-xs text-gray-400 mb-6">
            Generate your first vertical video in the AI Studio and publish it to the Qoneqt Global Feed!
          </p>
          <button
            onClick={() => onSelectVideoForStudio && onSelectVideoForStudio()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:opacity-90 transition"
          >
            Go to AI Studio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid, idx) => (
            <div
              key={vid._id || idx}
              className="glass-panel rounded-3xl p-5 border border-gray-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5">
                      <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        Q
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[140px]">
                        @qoneqt_creator
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        {new Date(vid.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    vid.status === 'PUBLISHED'
                      ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {vid.status === 'PUBLISHED' ? 'Published' : 'Ready'}
                  </span>
                </div>

                {/* Video Preview Canvas */}
                <div className="mb-3">
                  <VideoPlayer
                    videoUrl={vid.videoUrl}
                    thumbnailUrl={vid.thumbnailUrl}
                    title={vid.title || vid.topic}
                    hashtags={vid.hashtags}
                  />
                </div>

                {/* Metadata */}
                <div className="space-y-1.5 mt-2">
                  <h4 className="text-sm font-bold text-white line-clamp-1">{vid.title || vid.topic}</h4>
                  <p className="text-xs text-gray-400 line-clamp-2">{vid.description || vid.topic}</p>
                </div>
              </div>

              {/* Tags and Footer */}
              <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
                  <span>{(vid.hashtags || ['#Qoneqt', '#AI']).slice(0, 2).join(' ')}</span>
                </div>

                <a
                  href={vid.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition"
                >
                  <span>Direct URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
