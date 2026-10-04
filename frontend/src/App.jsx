import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Feed from './pages/Feed';
import History from './pages/History';
import Settings from './pages/Settings';
import Home from './pages/Home';
import VideoPreview from './pages/VideoPreview';
import { Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [previewVideo, setPreviewVideo] = useState(null);

  const openPreview = (video) => {
    setPreviewVideo(video);
    setActiveTab('preview');
  };
  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      <div>
        {/* Navigation Bar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Routing */}
        <main>
          {activeTab === 'home' && <Home onPreview={openPreview} />}
          {activeTab === 'preview' && <VideoPreview video={previewVideo} onBack={() => setActiveTab('home')} />}
          {activeTab === 'feed' && <Feed onSelectVideoForStudio={() => setActiveTab('home')} />}
          {activeTab === 'history' && <History />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Global Footer */}
      <footer className="glass-panel border-t border-gray-800/80 px-4 py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-gray-300">QONEQT &times; CTRL FREAK AI CHALLENGE</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
              Production Release
            </span>
          </div>

          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> for Next-Gen Autonomous Video Production
          </p>

          <div className="flex items-center gap-4 text-gray-400">
            <span>Gemini 2.5 Flash</span>
            <span>&bull;</span>
            <span>FFmpeg 9.0</span>
            <span>&bull;</span>
            <span>ElevenLabs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
