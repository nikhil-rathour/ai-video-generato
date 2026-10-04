import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, Volume2, VolumeX } from 'lucide-react';
import SpecularButton from '../components/reactbits/SpecularButton';

export default function VideoPreview({ video, onBack }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !video?.videoUrl) return undefined;
    player.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    return () => player.pause();
  }, [video?.videoUrl]);

  if (!video?.videoUrl) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-160px)] max-w-2xl items-center justify-center px-4 text-center">
        <div className="glass-panel rounded-3xl p-8">
          <p className="text-lg font-bold text-white">No video preview is available.</p>
          <SpecularButton onClick={onBack} size="sm" radius={12} tint="#ffffff" tintOpacity={0.1} blur={10} textColor="#ffffff" lineColor="#e9d5ff" baseColor="#6b21a8" autoAnimate>Back to generator</SpecularButton>
        </div>
      </main>
    );
  }

  const togglePlay = () => {
    const player = videoRef.current;
    if (!player) return;
    if (player.paused) player.play().then(() => setIsPlaying(true));
    else {
      player.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const player = videoRef.current;
    if (!player) return;
    player.muted = !player.muted;
    setMuted(player.muted);
  };

  return (
    <main className="min-h-[calc(100vh-76px)] bg-[#08060d] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <SpecularButton onClick={onBack} size="sm" radius={12} tint="#ffffff" tintOpacity={0.08} blur={10} textColor="#f5f3ff" lineColor="#e9d5ff" baseColor="#6b21a8" className="mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to generator
        </SpecularButton>
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl shadow-purple-950/30">
          <div className="relative mx-auto aspect-[9/16] max-h-[calc(100vh-190px)] bg-black">
            <video
              ref={videoRef}
              src={video.videoUrl}
              poster={video.thumbnailUrl}
              className="h-full w-full object-contain"
              controls
              muted={muted}
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-5 pt-16">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-200">Qoneqt AI video</p>
                <h1 className="mt-1 text-sm font-bold text-white sm:text-base">{video.title || 'Your generated video'}</h1>
              </div>
              <div className="pointer-events-auto flex gap-2">
                <button onClick={toggleMute} className="rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70" aria-label={muted ? 'Unmute video' : 'Mute video'}>
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button onClick={togglePlay} className="rounded-full bg-white p-2 text-[#120f17] hover:bg-purple-100" aria-label={isPlaying ? 'Pause video' : 'Play video'}>
                  <Play className={`h-4 w-4 ${isPlaying ? 'hidden' : ''}`} />
                  <span className={isPlaying ? 'text-xs font-bold' : 'hidden'}>Ⅱ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
