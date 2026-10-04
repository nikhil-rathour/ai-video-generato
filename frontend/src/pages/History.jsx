import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Download, Film, Play, RefreshCw, Sparkles, Trash2, X } from 'lucide-react';
import { videoApi } from '../services/api';
import SpecularButton from '../components/reactbits/SpecularButton';

const statusTone = {
  COMPLETED: 'border-emerald-300/20 bg-emerald-500/10 text-emerald-200',
  PUBLISHED: 'border-pink-300/20 bg-pink-500/10 text-pink-200',
  FAILED: 'border-rose-300/20 bg-rose-500/10 text-rose-200',
};

export default function History() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const response = await videoApi.getAll();
      setVideos(response.videos || []);
    } catch (error) {
      console.error('Failed to load videos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (id, event) => {
    event.stopPropagation();
    if (!window.confirm('Delete this video record?')) return;
    try {
      await videoApi.delete(id);
      setVideos((items) => items.filter((video) => (video._id || video.id) !== id));
      if ((selectedVideo?._id || selectedVideo?.id) === id) setSelectedVideo(null);
    } catch (error) {
      window.alert(`Failed to delete video: ${error.message}`);
    }
  };

  const badge = (status) => (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${statusTone[status] || 'border-indigo-300/20 bg-indigo-500/10 text-indigo-200'}`}>
      {status === 'COMPLETED' || status === 'PUBLISHED' ? <CheckCircle2 className="h-3 w-3" /> : status === 'FAILED' ? <AlertCircle className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
      {status || 'QUEUED'}
    </span>
  );

  return (
    <main className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-[#08060d] px-4 py-8 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_-12%,rgba(139,92,246,0.22),transparent_35%),radial-gradient(circle_at_100%_80%,rgba(59,130,246,0.12),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#100d18]/55 p-4 shadow-xl shadow-black/25 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/80 to-purple-600/80 text-white shadow-lg shadow-purple-950/40"><Film className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-200">Creator vault</p>
              <h1 className="text-lg font-extrabold text-white">Generation History</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-300">{videos.length} {videos.length === 1 ? 'project' : 'projects'}</span>
            <SpecularButton onClick={fetchVideos} disabled={loading} size="sm" radius={12} tint="#ffffff" tintOpacity={0.1} blur={10} textColor="#ffffff" lineColor="#e9d5ff" baseColor="#5b21b6" intensity={1.1} followMouse>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </SpecularButton>
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-72 flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-300 border-t-transparent" />
            <p className="mt-4 text-sm text-gray-300">Opening your creator vault…</p>
          </div>
        ) : videos.length === 0 ? (
          <section className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[#100d18]/55 p-9 text-center shadow-xl shadow-black/25 backdrop-blur-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200"><Sparkles className="h-6 w-6" /></div>
            <h2 className="mt-4 text-lg font-bold text-white">Your vault is empty.</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">Completed video projects will appear here with their scripts, metadata, and downloads.</p>
          </section>
        ) : (
          <div className={`grid gap-5 ${selectedVideo ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video, index) => {
                const id = video._id || video.id || index;
                const selected = (selectedVideo?._id || selectedVideo?.id) === id;
                return (
                  <article key={id} onClick={() => setSelectedVideo(video)} className={`group cursor-pointer overflow-hidden rounded-3xl border bg-[#100d18]/60 shadow-xl shadow-black/25 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-purple-300/35 ${selected ? 'border-purple-300/60 ring-1 ring-purple-300/20' : 'border-white/10'}`}>
                    <div className="relative aspect-[9/10] overflow-hidden bg-black">
                      {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : video.videoUrl ? <video src={video.videoUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" /> : <div className="flex h-full items-center justify-center text-gray-600"><Film className="h-8 w-8" /></div>}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#100d18] via-transparent to-black/15" />
                      <div className="absolute left-3 top-3">{badge(video.status)}</div>
                      {video.videoUrl && <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"><Play className="h-3.5 w-3.5 fill-white" /></span>}
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-200">{video.duration || 30}s · {video.style || 'Educational'}</p>
                        <h2 className="mt-1 line-clamp-2 text-sm font-extrabold text-white">{video.title || video.topic || 'Untitled video'}</h2>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3">
                      <span className="line-clamp-1 text-[11px] text-gray-400">{video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'Just created'}</span>
                      <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                        {video.videoUrl && <a href={video.videoUrl} download={`qoneqt_${video.title || 'video'}.mp4`} className="rounded-lg p-2 text-gray-300 transition hover:bg-white/10 hover:text-white" title="Download video"><Download className="h-3.5 w-3.5" /></a>}
                        <button onClick={(event) => handleDelete(video._id || video.id, event)} className="rounded-lg p-2 text-gray-400 transition hover:bg-rose-500/10 hover:text-rose-200" title="Delete video"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {selectedVideo && (
              <aside className="h-fit rounded-3xl border border-white/10 bg-[#100d18]/70 p-4 shadow-xl shadow-black/25 backdrop-blur-xl xl:sticky xl:top-24">
                <div className="mb-4 flex items-center justify-between">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-200">Project inspector</p><h2 className="text-sm font-bold text-white">Generation details</h2></div>
                  <button onClick={() => setSelectedVideo(null)} className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white" aria-label="Close inspector"><X className="h-4 w-4" /></button>
                </div>
                {selectedVideo.videoUrl ? (
                  <video src={selectedVideo.videoUrl} poster={selectedVideo.thumbnailUrl} className="aspect-[9/16] w-full rounded-2xl bg-black object-contain" controls playsInline />
                ) : (
                  <div className="rounded-2xl border border-amber-300/15 bg-amber-500/5 p-6 text-center"><AlertCircle className="mx-auto h-6 w-6 text-amber-200" /><p className="mt-2 text-sm font-semibold text-white">Video is not rendered yet.</p><p className="mt-1 text-xs text-gray-400">{selectedVideo.errorMessage || 'This project is still processing.'}</p></div>
                )}
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-3">
                  <p className="text-sm font-bold text-white">{selectedVideo.title || selectedVideo.topic}</p>
                  <p className="mt-2 text-xs leading-5 text-gray-300">{selectedVideo.script?.narration || selectedVideo.description || selectedVideo.topic}</p>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
