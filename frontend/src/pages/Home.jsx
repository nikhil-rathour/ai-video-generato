import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Globe2, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { gsap } from 'gsap';
import DitherVeil from '../components/reactbits/DitherVeil';
import ThoughtLine from '../components/reactbits/ThoughtLine';
import SpecularButton from '../components/reactbits/SpecularButton';
import { getBaseUrl, videoApi } from '../services/api';

const PIPELINE_STAGES = [
  { statuses: ['QUEUED', 'SCRIPTING'], label: 'Writing your video script' },
  { statuses: ['COLLECTING_MEDIA'], label: 'Collecting visual assets' },
  { statuses: ['GENERATING_VOICE'], label: 'Creating voice narration' },
  { statuses: ['RENDERING'], label: 'Rendering your vertical video' },
  { statuses: ['COMPLETED', 'PUBLISHED'], label: 'Video ready to publish' },
];

export default function Home({ onPreview }) {
  const [prompt, setPrompt] = useState('Create a cinematic short about the AI tools changing how developers work.');
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState('Educational');
  const [language, setLanguage] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [status, setStatus] = useState('IDLE');
  const [error, setError] = useState('');
  const [videoData, setVideoData] = useState(null);
  const heroRef = useRef(null);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline
        .from('[data-hero-copy]', { y: 28, autoAlpha: 0, duration: 0.7 })
        .from('[data-veil-frame]', { y: 42, scale: 0.94, autoAlpha: 0, duration: 0.9 }, '-=0.35')
        .from('[data-generate-button]', { y: 18, autoAlpha: 0, duration: 0.5 }, '-=0.3');

      gsap.to('[data-hero-orb="left"]', { x: 40, y: -24, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('[data-hero-orb="right"]', { x: -36, y: 30, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }, heroRef);

    return () => context.revert();
  }, []);

  useEffect(() => {
    if (!currentVideoId) return undefined;
    const eventSource = new EventSource(`${getBaseUrl()}/video/progress/${currentVideoId}`);
    let pollInterval;

    const finish = (data) => {
      setIsGenerating(false);
      if (data?.video) setVideoData(data.video);
      eventSource.close();
      if (pollInterval) window.clearInterval(pollInterval);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.progress !== undefined) setProgress(data.progress);
        if (data.step) setCurrentStep(data.step);
        if (data.status) setStatus(data.status);
        if (data.video) setVideoData(data.video);
        if (data.status === 'COMPLETED' || data.status === 'PUBLISHED') finish(data);
        if (data.status === 'FAILED' || data.error) {
          setError(data.error || 'Video generation failed. Please try again.');
          setIsGenerating(false);
          eventSource.close();
        }
      } catch {
        // Ignore malformed SSE heartbeat events.
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      pollInterval = window.setInterval(async () => {
        try {
          const response = await videoApi.getById(currentVideoId);
          const video = response.video;
          if (!video) return;
          setVideoData(video);
          setProgress(video.progress || 0);
          setStatus(video.status || 'QUEUED');
          setCurrentStep(video.currentStep || 'Preparing your video…');
          if (video.status === 'COMPLETED' || video.status === 'PUBLISHED') finish({ video });
          if (video.status === 'FAILED') {
            setError(video.errorMessage || 'Video generation failed. Please try again.');
            setIsGenerating(false);
            window.clearInterval(pollInterval);
          }
        } catch {
          // The next polling cycle will retry.
        }
      }, 3000);
    };

    return () => {
      eventSource.close();
      if (pollInterval) window.clearInterval(pollInterval);
    };
  }, [currentVideoId]);

  const submitPrompt = async (event) => {
    event.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setProgress(5);
    setStatus('QUEUED');
    setCurrentStep('Initializing AI engine…');
    setError('');
    setVideoData(null);
    try {
      const response = await videoApi.generate({ topic: prompt.trim(), duration, style, language, aspectRatio: '9:16' });
      if (response.videoId) {
        setCurrentVideoId(response.videoId);
        setVideoData(response.video || null);
      } else {
        throw new Error('The video job could not be started.');
      }
    } catch (requestError) {
      setIsGenerating(false);
      setError(requestError.response?.data?.error || requestError.message || 'Unable to start video generation.');
    }
  };

  const activeStage = PIPELINE_STAGES.findIndex((stage) => stage.statuses.includes(status));
  const thoughtSteps = PIPELINE_STAGES.slice(0, Math.max(0, activeStage) + 1).map((stage) => stage.label);

  return (
    <main>
      <section ref={heroRef} className="relative isolate flex h-[calc(100svh-76px)] items-center justify-center overflow-hidden bg-[#08060d] px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
        <div data-veil-frame className="absolute inset-0 z-0 bg-[#08060d]">
          <DitherVeil
            src="https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop"
            pattern="floyd"
            pixelSize={2}
            inkColor="#120f17"
            paperColor="#f4f1ea"
            revealRadius={200}
            softness={0.6}
            linger={1}
            fit="cover"
            rimColor="#a78bfa"
            palette="duotone"
            levels={2}
            contrast={1.15}
            brightness={0}
            rim={0}
            reverse={false}
            wander={false}
            clickBurst
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,6,13,0.72)_0%,rgba(8,6,13,0.1)_45%,rgba(8,6,13,0.78)_100%)]" />
        </div>
        <div data-hero-orb="left" className="pointer-events-none absolute -left-32 top-44 z-10 h-72 w-72 rounded-full bg-indigo-600/15 blur-3xl" />
        <div data-hero-orb="right" className="pointer-events-none absolute -right-24 bottom-32 z-10 h-80 w-80 rounded-full bg-pink-600/10 blur-3xl" />
        <div className="pointer-events-none relative z-20 mx-auto flex w-full max-w-6xl flex-col items-center justify-center text-center">
          <form data-hero-copy onSubmit={submitPrompt} className="pointer-events-auto w-full max-w-4xl rounded-3xl border border-white/15 bg-[#100d18]/55 p-3 text-left shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-4">
            <div className="flex flex-col gap-3 px-2 pb-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-200"><Sparkles className="h-3.5 w-3.5" /></span>
                <span className="text-sm font-semibold text-white">What video should we create?</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium text-gray-400">Duration
                  <select value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="min-w-0 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-gray-100 outline-none focus:border-purple-400/60"><option value={30}>30 sec</option><option value={45}>45 sec</option><option value={60}>60 sec</option></select>
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium text-gray-400">Style
                  <select value={style} onChange={(event) => setStyle(event.target.value)} className="min-w-0 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-gray-100 outline-none focus:border-purple-400/60"><option>Educational</option><option>Viral</option><option>Storytelling</option><option>News</option></select>
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium text-gray-400">Language
                  <select value={language} onChange={(event) => setLanguage(event.target.value)} className="min-w-0 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-gray-100 outline-none focus:border-purple-400/60"><option>English</option><option>Hindi</option><option>Spanish</option><option>German</option></select>
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={2}
                aria-label="Describe the video to create"
                className="min-h-[64px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-gray-400 focus:border-purple-400/60 focus:ring-1 focus:ring-purple-400/40"
                placeholder="Describe your video idea..."
              />
              <SpecularButton
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                size="sm"
                radius={16}
                tint="#7c3aed"
                tintOpacity={0.85}
                blur={10}
                textColor="#ffffff"
                lineColor="#f5d0fe"
                baseColor="#4c1d95"
                intensity={1.2}
                shineSize={10}
                shineFade={40}
                followMouse
                proximity={250}
                className="min-h-[64px] w-full shrink-0 !px-5 text-xs font-extrabold uppercase tracking-wide sm:w-40"
              >
                {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {isGenerating ? 'Creating…' : 'Create video'}
              </SpecularButton>
            </div>
          </form>
          {(isGenerating || status === 'COMPLETED' || error) && (
            <div className="pointer-events-auto mt-4 w-full max-w-4xl rounded-2xl border border-white/15 bg-[#100d18]/70 px-4 py-3 text-left shadow-xl shadow-black/30 backdrop-blur-xl">
              {error ? (
                <div className="flex items-center gap-2 text-sm text-rose-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>
              ) : (
                <>
                  <ThoughtLine
                    working={isGenerating}
                    steps={thoughtSteps}
                    label={currentStep || 'Thinking…'}
                    doneLabel="Video created in"
                    glyph="sparkle"
                    fontSize={14}
                    breathPeriod={1.6}
                    breathDepth={0.45}
                    settleDuration={350}
                    settleBlur={2}
                    collapsible
                    collapseOnSettle
                    showTimer
                  />
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-all duration-500" style={{ width: `${status === 'COMPLETED' ? 100 : progress}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-300">
                    <span>{status === 'COMPLETED' ? 'Your video is ready.' : currentStep || 'Preparing your video…'}</span>
                    <span>{status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : `${Math.round(progress)}%`}</span>
                  </div>
                  {videoData?.videoUrl && (
                    <SpecularButton onClick={() => onPreview(videoData)} size="sm" radius={10} tint="#ffffff" tintOpacity={0.1} blur={10} textColor="#ffffff" lineColor="#e9d5ff" baseColor="#6b21a8" intensity={1.1} followMouse>
                      Preview video
                    </SpecularButton>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
