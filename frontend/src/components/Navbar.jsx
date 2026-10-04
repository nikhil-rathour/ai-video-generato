import React, { useState, useEffect } from 'react';
import { Home, Sparkles, Video, Film, Radio, Settings } from 'lucide-react';
import { settingsApi } from '../services/api';

export default function Navbar({ activeTab, setActiveTab }) {
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await settingsApi.getStatus();
        setSystemHealth(data.success);
      } catch {
        setSystemHealth(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'studio', label: 'AI Studio', icon: Sparkles },
    { id: 'feed', label: 'Qoneqt Feed', icon: Radio },
    { id: 'history', label: 'History & Vault', icon: Film },
    { id: 'settings', label: 'Integrations & API', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-gray-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
              <Video className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                QONEQT
              </span>
              <span className="text-xs px-2 py-0.5 font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                AI STUDIO
              </span>
            </div>
            <p className="text-[10px] text-gray-400 tracking-wider uppercase font-medium">
              Autonomous Video Pipeline
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-gray-900/60 p-1 rounded-xl border border-gray-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-600/25'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Engine Status Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${systemHealth ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${systemHealth ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-gray-300 font-medium">
              {systemHealth ? 'AI Engine Ready' : 'Connecting Engine...'}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition"
            title="System Settings & API Keys"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
