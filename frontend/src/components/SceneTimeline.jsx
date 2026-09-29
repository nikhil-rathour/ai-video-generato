import React from 'react';
import { Film, Clock, Image as ImageIcon, Volume2, Type, Sparkles, Video } from 'lucide-react';

export default function SceneTimeline({ scenes = [] }) {
  if (!scenes || scenes.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-gray-500 border border-gray-800">
        <Film className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
        <p className="text-sm font-medium">Storyboard & Scene Breakdown Standby</p>
        <p className="text-xs mt-1">Scenes will appear here as Gemini constructs your multi-scene video sequence.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-gray-200">Scene Storyboard Breakdown</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
            {scenes.length} Scenes
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          Total Duration: {scenes.reduce((acc, s) => acc + (Number(s.duration) || 0), 0)}s
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scenes.map((scene, idx) => {
          const sceneNum = scene.sceneNumber || (idx + 1);
          return (
            <div
              key={idx}
              className="glass-card rounded-xl p-4 border border-gray-800 hover:border-purple-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Scene Header */}
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-800/60">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center font-mono">
                      {sceneNum}
                    </span>
                    <span className="text-xs font-semibold text-gray-300">
                      Scene {sceneNum}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span>{scene.duration}s</span>
                  </div>
                </div>

                {/* Voiceover Text */}
                <div className="mb-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 mb-1">
                    <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                    <span>Voiceover Narration</span>
                  </div>
                  <p className="text-xs text-gray-200 bg-gray-900/60 p-2 rounded-lg border border-gray-800/80 leading-relaxed italic">
                    "{scene.voiceover}"
                  </p>
                </div>

                {/* Visual Query & On-Screen Text */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-gray-900/40 p-2 rounded-lg border border-gray-800/60">
                    <div className="flex items-center gap-1 text-gray-400 font-medium mb-0.5">
                      <ImageIcon className="w-3 h-3 text-cyan-400" />
                      <span>Visual Query</span>
                    </div>
                    <p className="text-gray-300 truncate font-mono text-[10px]" title={scene.visualQuery}>
                      {scene.visualQuery}
                    </p>
                  </div>

                  <div className="bg-gray-900/40 p-2 rounded-lg border border-gray-800/60">
                    <div className="flex items-center gap-1 text-gray-400 font-medium mb-0.5">
                      <Type className="w-3 h-3 text-amber-400" />
                      <span>On-Screen Caption</span>
                    </div>
                    <p className="text-amber-300 font-bold truncate text-[10px]" title={scene.onScreenText}>
                      {scene.onScreenText || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Media Asset Source Footer */}
              <div className="mt-3 pt-2 border-t border-gray-800/40 flex items-center justify-between text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Video className="w-3 h-3 text-purple-400" />
                  Source: <strong className="text-gray-300 capitalize">{scene.source || 'Pexels / Neural Engine'}</strong>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                  Transition: {scene.transition || 'Fade'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
