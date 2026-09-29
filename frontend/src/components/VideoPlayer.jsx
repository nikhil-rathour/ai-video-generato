import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Maximize2, RotateCcw, Heart, MessageCircle, Share2, Sparkles, Music } from 'lucide-react';

export default function VideoPlayer({ videoUrl, thumbnailUrl, title, hashtags = [], author = '@qoneqt_creator' }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(248);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(curr);
    setDuration(dur);
    setProgress((curr / dur) * 100);
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * (videoRef.current.duration || 0);
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `qoneqt_${title ? title.toLowerCase().replace(/\s+/g, '_') : 'video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative mx-auto flex flex-col items-center">
      {/* Smartphone Mockup Frame */}
      <div className="relative w-full max-w-[340px] md:max-w-[360px] aspect-9-16 bg-black rounded-[42px] p-3 shadow-2xl shadow-purple-950/40 border-[6px] border-gray-800 ring-1 ring-white/10 overflow-hidden select-none">
        
        {/* Dynamic Island / Camera Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-between px-3 border border-gray-800">
          <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-gray-700"></div>
          <div className="w-2 h-2 rounded-full bg-indigo-500/80 animate-pulse"></div>
        </div>

        {/* Video Canvas Container */}
        <div 
          className="relative w-full h-full rounded-[30px] overflow-hidden bg-gray-950 cursor-pointer group"
          onClick={togglePlay}
          onMouseEnter={() => setShowControls(true)}
        >
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbnailUrl}
              className="w-full h-full object-cover"
              playsInline
              loop
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-gray-900 to-[#0b0f19]">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
              <h4 className="text-sm font-semibold text-gray-200">Video Canvas Standby</h4>
              <p className="text-xs text-gray-400 mt-1">Enter a topic and generate to render your 1080x1920 vertical video</p>
            </div>
          )}

          {/* Center Play Button Overlay */}
          {!isPlaying && videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/40 transform group-hover:scale-110 transition duration-200">
                <Play className="w-7 h-7 text-white ml-1 fill-white" />
              </div>
            </div>
          )}

          {/* Social Overlay Elements (Qoneqt Global Feed Simulation) */}
          {videoUrl && (
            <>
              {/* Right Action Bar */}
              <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-20" onClick={(e) => e.stopPropagation()}>
                {/* Author Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-md">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="Creator"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-pink-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow">
                    +
                  </div>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => {
                    setLiked(!liked);
                    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
                  }}
                  className="flex flex-col items-center text-white gap-1 hover:scale-110 transition"
                >
                  <div className={`p-2 rounded-full backdrop-blur-md ${liked ? 'bg-red-500/30 text-red-400' : 'bg-black/40 text-white'}`}>
                    <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                  </div>
                  <span className="text-[10px] font-medium drop-shadow">{likeCount}</span>
                </button>

                {/* Comment Button */}
                <button className="flex flex-col items-center text-white gap-1 hover:scale-110 transition">
                  <div className="p-2 rounded-full bg-black/40 backdrop-blur-md">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium drop-shadow">36</span>
                </button>

                {/* Share Button */}
                <button className="flex flex-col items-center text-white gap-1 hover:scale-110 transition">
                  <div className="p-2 rounded-full bg-black/40 backdrop-blur-md">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium drop-shadow">18</span>
                </button>

                {/* Spinning Music Disc */}
                <div className={`w-9 h-9 rounded-full bg-gradient-to-tr from-gray-900 via-purple-950 to-indigo-900 border-2 border-gray-700 flex items-center justify-center shadow-lg ${isPlaying ? 'animate-spin' : ''}`}>
                  <Music className="w-4 h-4 text-purple-300" />
                </div>
              </div>

              {/* Bottom Metadata Overlay */}
              <div className="absolute bottom-6 left-3 right-16 z-20 text-left pointer-events-none" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs font-bold text-white drop-shadow flex items-center gap-1.5 mb-1">
                  <span>{author}</span>
                  <span className="bg-indigo-500/80 text-white text-[9px] px-1.5 py-0.2 rounded-full font-semibold">Qoneqt AI</span>
                </p>
                <p className="text-xs text-gray-200 line-clamp-2 drop-shadow font-medium">
                  {title || 'AI Generated Short Video'}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {hashtags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] text-indigo-300 font-semibold drop-shadow">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Bottom Progress Scrubber */}
          {videoUrl && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 hover:h-3 transition-all cursor-pointer z-30"
              onClick={(e) => {
                e.stopPropagation();
                handleSeek(e);
              }}
            >
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transform scale-0 group-hover:scale-100 transition"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* External Player Control Toolbar */}
      {videoUrl && (
        <div className="mt-4 w-full max-w-[360px] flex items-center justify-between p-2.5 rounded-2xl bg-gray-900/90 border border-gray-800 shadow-lg text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="font-mono text-[11px] text-gray-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
