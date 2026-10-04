import React, { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, ExternalLink, Radio, Sparkles } from 'lucide-react';
import { videoApi } from '../services/api';
import SpecularButton from '../components/reactbits/SpecularButton';

export default function Feed({ onSelectVideoForStudio }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const response = await videoApi.getAll();
      setVideos((response.videos || []).filter((video) => video.videoUrl));
    } catch (error) {
      console.error('Failed to load feed videos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <main className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-[#08060d] px-4 py-8 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(139,92,246,0.24),transparent_34%),radial-gradient(circle_at_0%_70%,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_100%_60%,rgba(236,72,153,0.1),transparent_28%)]" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-purple-700/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="h-10 w-10 rounded-full border-2 border-purple-300 border-t-transparent animate-spin" />
            <p className="mt-4 text-sm text-gray-300">Syncing the global feed…</p>
          </div>
        ) : videos.length === 0 ? (
          <section className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[#100d18]/55 p-8 text-center shadow-xl shadow-black/25 backdrop-blur-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200"><Radio className="h-6 w-6" /></div>
            <h2 className="mt-4 text-lg font-bold text-white">Your feed is waiting for its first story.</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">Create a vertical video from the Home page and it will appear here when rendering is complete.</p>
            <SpecularButton onClick={onSelectVideoForStudio} size="sm" radius={12} tint="#7c3aed" tintOpacity={0.8} blur={10} textColor="#ffffff" lineColor="#e9d5ff" baseColor="#4c1d95" className="mt-5">
              Create a video <ArrowUpRight className="h-3.5 w-3.5" />
            </SpecularButton>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((video, index) => (
              <article key={video._id || video.id || index} className="group overflow-hidden rounded-3xl border border-white/10 bg-[#100d18]/60 shadow-xl shadow-black/25 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-purple-300/35">
                <div className="relative aspect-[9/11] overflow-hidden bg-black">
                  <video src={video.videoUrl} poster={video.thumbnailUrl} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" muted loop playsInline preload="metadata" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#100d18] via-transparent to-black/15" />
                  <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
                    {video.status === 'PUBLISHED' ? 'Published' : 'Ready'}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="flex items-center gap-2 text-xs text-purple-100">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 text-[10px] font-black text-white">Q</span>
                      @qoneqt_creator
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-200" />
                    </div>
                    <h2 className="mt-2 line-clamp-2 text-base font-extrabold text-white">{video.title || video.topic || 'AI generated video'}</h2>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <p className="line-clamp-1 text-xs text-gray-400">{(video.hashtags || ['#Qoneqt', '#AI']).slice(0, 3).join(' ')}</p>
                  <a href={video.videoUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-purple-200 transition hover:text-white">
                    Watch <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
