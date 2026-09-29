import React, { useState } from 'react';
import { Sparkles, Copy, Check, MessageSquare, Target, Hash, FileText } from 'lucide-react';

export default function ScriptViewer({ script, title, description, hashtags = [], llmProvider }) {
  const [copied, setCopied] = useState(false);

  if (!script && !title) {
    return null;
  }

  const handleCopy = () => {
    const textToCopy = `TITLE: ${title}\n\nHOOK: ${script?.hook || ''}\n\nNARRATION:\n${script?.narration || description}\n\nHASHTAGS: ${(hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Script & Narrative Blueprint</h3>
            <p className="text-[11px] text-gray-400">
              Provider: <span className="text-indigo-300 font-semibold">{llmProvider || 'Gemini 2.5 Flash'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-medium text-gray-300 hover:text-white hover:border-gray-700 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy Script'}</span>
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* Title & Hook */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Video Title</span>
            </div>
            <p className="font-bold text-gray-100 text-sm">{title || script?.title}</p>
          </div>

          <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800">
            <div className="flex items-center gap-1.5 text-pink-400 font-semibold mb-1">
              <Target className="w-3.5 h-3.5" />
              <span>Scroll-Stopping Hook</span>
            </div>
            <p className="text-gray-200 font-medium italic">"{script?.hook || 'Attention Grabber'}"</p>
          </div>
        </div>

        {/* Full Narration Script */}
        <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
          <div className="flex items-center gap-1.5 text-purple-400 font-semibold mb-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Complete Voiceover Narration</span>
          </div>
          <p className="text-gray-200 leading-relaxed font-sans text-xs">
            {script?.narration || description}
          </p>
        </div>

        {/* Target Audience & Hashtags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-400">Target Audience:</span>
            <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 font-medium">
              {script?.target_audience || 'Modern Creators & Developers'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Hash className="w-3.5 h-3.5 text-cyan-400" />
            {(hashtags || []).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
