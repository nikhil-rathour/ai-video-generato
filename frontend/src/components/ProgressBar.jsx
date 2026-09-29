import React from 'react';
import { CheckCircle2, Loader2, Sparkles, Film, Mic, Video, Send, AlertCircle } from 'lucide-react';

export default function ProgressBar({ status, progress = 0, currentStep = '', error = null }) {
  const steps = [
    { id: 'ANALYZE', label: 'Topic Analyzed', minProgress: 10, icon: Sparkles },
    { id: 'SCRIPT', label: 'Script Generated', minProgress: 25, icon: Film },
    { id: 'SCENES', label: 'Scene Plan Generated', minProgress: 35, icon: Film },
    { id: 'VISUALS', label: 'Visuals Collected', minProgress: 55, icon: Video },
    { id: 'VOICE', label: 'Voice Generated', minProgress: 75, icon: Mic },
    { id: 'RENDER', label: 'Video Rendering', minProgress: 85, icon: Video },
    { id: 'COMPLETE', label: 'Video Completed', minProgress: 100, icon: Send },
  ];

  const getStepStatus = (step, index) => {
    if (error) {
      if (progress >= step.minProgress) return 'done';
      return 'pending';
    }
    if (progress >= step.minProgress || status === 'COMPLETED' || status === 'PUBLISHED') {
      return 'done';
    }
    // Check if currently active step
    const prevMin = index === 0 ? 0 : steps[index - 1].minProgress;
    if (progress >= prevMin && progress < step.minProgress) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-purple-500/20 shadow-xl shadow-purple-950/20">
      {/* Header & Percentage */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            {status === 'COMPLETED' || status === 'PUBLISHED' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : error ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              {error ? 'Generation Pipeline Interrupted' : (status === 'COMPLETED' ? 'Video Generation Completed!' : 'Generating Vertical Video')}
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              {error ? error : (currentStep || 'Processing pipeline components...')}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono font-bold text-lg text-indigo-400">
            {Math.min(100, Math.round(progress))}%
          </span>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Overall Pipeline</p>
        </div>
      </div>

      {/* Progress Track Bar */}
      <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden mb-6 p-0.5 border border-gray-700/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            error
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-sm shadow-purple-500'
          }`}
          style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
        ></div>
      </div>

      {/* Step Grid Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {steps.map((step, idx) => {
          const stepStatus = getStepStatus(step, idx);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-2.5 rounded-xl border transition-all ${
                stepStatus === 'done'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : stepStatus === 'active'
                  ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-200 shadow-md shadow-indigo-500/10 animate-pulse'
                  : 'bg-gray-900/40 border-gray-800 text-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-3.5 h-3.5 ${
                  stepStatus === 'done' ? 'text-emerald-400' : stepStatus === 'active' ? 'text-indigo-400' : 'text-gray-400'
                }`} />
                {stepStatus === 'done' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : stepStatus === 'active' ? (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                ) : (
                  <span className="text-[10px] text-gray-400 font-mono">0{idx + 1}</span>
                )}
              </div>
              <p className="text-[11px] font-semibold leading-tight line-clamp-2">
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
