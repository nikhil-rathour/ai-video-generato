import React, { useState, useEffect } from 'react';
import { Film, Trash2, Download, Play, RefreshCw, Eye, Sparkles, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { videoApi } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';

export default function History({ onSelectVideo }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await videoApi.getAll();
      setVideos(res.videos || []);
    } catch (err) {
      console.error('Failed to load videos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this video record?')) {
      try {
        await videoApi.delete(id);
        setVideos(videos.filter(v => (v._id || v.id) !== id));
        if (selectedVideo && (selectedVideo._id || selectedVideo.id) === id) {
          setSelectedVideo(null);
        }
      } catch (err) {
        alert('Failed to delete video: ' + err.message);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'PUBLISHED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Published</span>;
      case 'FAILED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1"><Clock className="w-3 h-3" /> {status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Film className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
              Vault & Archives
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white">
            Generation History
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse all past video generation jobs, scripts, audio assets, and rendering logs.
          </p>
        </div>

        <button
          onClick={fetchVideos}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-semibold text-gray-200 transition self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-gray-400">Loading history records...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto border border-gray-800">
          <Film className="w-12 h-12 mx-auto mb-3 text-gray-500 opacity-50" />
          <h3 className="text-base font-bold text-white mb-1">No Generation Records</h3>
          <p className="text-xs text-gray-400">Your created videos will be recorded and accessible here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* List Table/Cards */}
          <div className={`${selectedVideo ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
            {videos.map((vid) => {
              const isSelected = selectedVideo && (selectedVideo._id || selectedVideo.id) === (vid._id || vid.id);
              return (
                <div
                  key={vid._id || vid.id}
                  onClick={() => setSelectedVideo(vid)}
                  className={`glass-panel rounded-2xl p-4 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-950/40'
                      : 'border-gray-800/80 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Thumbnail / Icon */}
                    <div className="w-16 h-20 rounded-xl bg-gray-950 border border-gray-800 overflow-hidden flex-shrink-0 relative group">
                      {vid.thumbnailUrl ? (
                        <img src={vid.thumbnailUrl} alt="Poster" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-600">
                          <Film className="w-6 h-6" />
                        </div>
                      )}
                      {vid.videoUrl && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white line-clamp-1">{vid.title || vid.topic}</h4>
                        {getStatusBadge(vid.status)}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1 italic">"{vid.topic}"</p>
                      
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                        <span>{vid.duration || 30}s &bull; {vid.style || 'Educational'}</span>
                        <span>&bull;</span>
                        <span>{new Date(vid.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                    {vid.videoUrl && (
                      <a
                        href={vid.videoUrl}
                        download={`qoneqt_${vid.title || 'video'}.mp4`}
                        className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition"
                        title="Download Video"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={(e) => handleDelete(vid._id || vid.id, e)}
                      className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition"
                      title="Delete Video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Video Detail Inspector */}
          {selectedVideo && (
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-gray-800 sticky top-24">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-800">
                <h3 className="text-sm font-bold text-white">Video Inspector</h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {selectedVideo.videoUrl ? (
                <VideoPlayer
                  videoUrl={selectedVideo.videoUrl}
                  thumbnailUrl={selectedVideo.thumbnailUrl}
                  title={selectedVideo.title}
                  hashtags={selectedVideo.hashtags}
                />
              ) : (
                <div className="p-8 text-center bg-gray-950 rounded-2xl border border-gray-800">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-300">Video Not Rendered Yet</p>
                  <p className="text-[11px] text-gray-500 mt-1">{selectedVideo.errorMessage || 'Job is incomplete or in progress.'}</p>
                </div>
              )}

              {/* Script Breakdown */}
              {selectedVideo.script && (
                <div className="mt-4 p-3.5 rounded-2xl bg-gray-950/80 border border-gray-800/80 text-xs space-y-2">
                  <p className="font-bold text-indigo-300">{selectedVideo.title}</p>
                  <p className="text-gray-300 leading-relaxed text-[11px]">{selectedVideo.script.narration || selectedVideo.description}</p>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
