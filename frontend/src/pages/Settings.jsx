import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, CheckCircle2, AlertCircle, RefreshCw, Key, ShieldCheck, Cpu, HardDrive, Video, Radio, Database, Cloud } from 'lucide-react';
import { settingsApi } from '../services/api';

export default function Settings() {
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testingService, setTestingService] = useState(null);
  const [testResult, setTestResult] = useState({});

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getStatus();
      setServices(res.services);
    } catch (err) {
      console.error('Failed to get status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTest = async (providerKey) => {
    setTestingService(providerKey);
    try {
      const res = await settingsApi.testApi(providerKey);
      setTestResult(prev => ({ ...prev, [providerKey]: { success: true, message: res.message } }));
    } catch (err) {
      setTestResult(prev => ({ ...prev, [providerKey]: { success: false, message: err.response?.data?.error || err.message } }));
    } finally {
      setTestingService(null);
    }
  };

  const getServiceIcon = (key) => {
    switch (key) {
      case 'gemini':
      case 'groq':
        return <Cpu className="w-5 h-5 text-indigo-400" />;
      case 'pexels':
      case 'pixabay':
        return <Video className="w-5 h-5 text-pink-400" />;
      case 'elevenlabs':
        return <Radio className="w-5 h-5 text-purple-400" />;
      case 'cloudinary':
        return <Cloud className="w-5 h-5 text-cyan-400" />;
      case 'mongodb':
        return <Database className="w-5 h-5 text-emerald-400" />;
      case 'qoneqt':
        return <Radio className="w-5 h-5 text-indigo-400" />;
      case 'ffmpeg':
        return <HardDrive className="w-5 h-5 text-amber-400" />;
      default:
        return <Key className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <SettingsIcon className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              System Architecture & Diagnostics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white">
            Integrations & API Health
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Inspect active API keys, media scrapers, TTS engines, database state, and FFmpeg renderers.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-semibold text-gray-200 transition self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Health Checks</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-gray-400">Inspecting engine integrations...</p>
        </div>
      ) : services ? (
        <div className="space-y-6">
          
          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(services).map(([key, s]) => {
              const test = testResult[key];
              return (
                <div
                  key={key}
                  className="glass-panel rounded-2xl p-5 border border-gray-800 flex flex-col justify-between hover:border-gray-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center">
                        {getServiceIcon(key)}
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        s.configured || s.status === 'OPTIMIZED_AND_READY' || s.status === 'READY'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : s.status.includes('FALLBACK') || s.status.includes('ACTIVE') || s.status.includes('DEMO')
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}>
                        {s.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-0.5">{s.name}</h4>
                    <p className="text-xs text-gray-400 mb-3">{s.role}</p>

                    {s.path && (
                      <p className="text-[10px] font-mono text-gray-500 bg-gray-950 p-2 rounded-lg truncate mb-2" title={s.path}>
                        Binary: {s.path}
                      </p>
                    )}
                    {s.endpoint && (
                      <p className="text-[10px] font-mono text-gray-500 bg-gray-950 p-2 rounded-lg truncate mb-2">
                        Endpoint: {s.endpoint}
                      </p>
                    )}
                  </div>

                  {/* Diagnostic Test Button */}
                  <div className="mt-3 pt-3 border-t border-gray-800/60">
                    {['gemini', 'pexels', 'elevenlabs'].includes(key) && (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleTest(key)}
                          disabled={testingService === key}
                          className="w-full py-1.5 px-3 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[11px] font-semibold text-gray-300 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${testingService === key ? 'animate-spin' : ''}`} />
                          <span>Test API Connection</span>
                        </button>
                        {test && (
                          <div className={`p-2 rounded-lg text-[10px] leading-snug ${test.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                            {test.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Security & Env Configuration Guide */}
          <div className="glass-panel rounded-3xl p-6 border border-gray-800 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Environment Variables Configuration (.env)</span>
            </div>
            <p className="text-xs text-gray-400">
              API keys are strictly kept server-side and never exposed to client-side bundles. To configure or override keys, edit <code>backend/.env</code>:
            </p>
            <div className="p-4 rounded-xl bg-gray-950 font-mono text-xs text-gray-300 overflow-x-auto border border-gray-800 leading-relaxed">
              <code>
                GEMINI_API_KEY=your_gemini_key<br />
                GROQ_API_KEY=your_groq_key<br />
                PEXELS_API_KEY=your_pexels_key<br />
                PIXABAY_API_KEY=your_pixabay_key<br />
                ELEVENLABS_API_KEY=your_elevenlabs_key<br />
                CLOUDINARY_CLOUD_NAME=your_cloud_name<br />
                CLOUDINARY_API_KEY=your_cloudinary_key<br />
                CLOUDINARY_API_SECRET=your_cloudinary_secret<br />
                MONGODB_URI=your_mongodb_uri<br />
                QONEQT_API_KEY=your_qoneqt_key<br />
                QONEQT_API_URL=https://api.qoneqt.com/v1
              </code>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
