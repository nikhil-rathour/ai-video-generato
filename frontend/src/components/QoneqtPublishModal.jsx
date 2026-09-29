import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, X, Globe, Radio, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { qoneqtApi } from '../services/api';

export default function QoneqtPublishModal({ video, isOpen, onClose, onPublished }) {
  const [title, setTitle] = useState(video?.title || '');
  const [caption, setCaption] = useState(video?.description || '');
  const [tags, setTags] = useState((video?.hashtags || []).join(' '));
  const [channel, setChannel] = useState('Qoneqt Global Feed');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !video) return null;

  const handlePublish = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    setError(null);

    try {
      const tagArray = tags.split(/\s+/).filter(t => t.startsWith('#') || t.length > 0).map(t => t.startsWith('#') ? t : `#${t}`);
      const res = await qoneqtApi.publish({
        videoId: video._id || video.id,
        title,
        customCaption: caption,
        tags: tagArray
      });

      setPublishResult(res.publishResult);
      if (onPublished) onPublished(res.video);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 border border-purple-500/30 shadow-2xl shadow-purple-950/50">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 p-0.5 shadow-md">
              <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-pink-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Publish to Qoneqt Global Feed</h3>
              <p className="text-xs text-gray-400">Direct creator feed broadcast integration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Published Successfully */}
        {publishResult ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">
                {publishResult.isLive ? 'Video Published to Live Qoneqt Feed!' : 'Video Ready in Qoneqt Feed Integration'}
              </h4>
              <p className="text-xs text-gray-300 mt-1 max-w-sm mx-auto">
                {publishResult.message}
              </p>
            </div>

            <div className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800 text-left text-xs font-mono space-y-1 text-gray-300">
              <p><strong className="text-purple-400">Post ID:</strong> {publishResult.postId}</p>
              <p><strong className="text-purple-400">Mode:</strong> {publishResult.mode}</p>
              <p className="truncate"><strong className="text-purple-400">URL:</strong> {publishResult.feedUrl}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs hover:opacity-90 transition"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          /* Publish Form */
          <form onSubmit={handlePublish} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Post Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Feed Caption & Description</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Hashtags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="#Qoneqt #AI #Tech"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Target Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Qoneqt Global Feed">Qoneqt Global Feed</option>
                  <option value="AI & Tech Spotlight">AI & Tech Spotlight</option>
                  <option value="Developer Trends">Developer Trends</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200 flex items-start gap-2">
              <Globe className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span>
                Publishes directly via <code>qoneqtService.js</code>. If live API keys are provided in <code>.env</code>, broadcasts immediately to Qoneqt production.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 font-semibold hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPublishing}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
