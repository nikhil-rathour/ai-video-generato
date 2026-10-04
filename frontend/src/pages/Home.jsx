import React, { useState } from 'react';
import { ArrowDown, ArrowUpRight, Bot, CheckCircle2, Send, Sparkles, Wand2 } from 'lucide-react';
import DitherVeil from '../components/reactbits/DitherVeil';

export default function Home({ onStartGeneration }) {
  const [prompt, setPrompt] = useState('Create a cinematic short about the AI tools changing how developers work.');

  const scrollToChat = () => {
    document.getElementById('video-generation-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submitPrompt = (event) => {
    event.preventDefault();
    if (prompt.trim()) onStartGeneration(prompt.trim());
  };

  return (
    <main>
      <section className="relative isolate min-h-[calc(100vh-76px)] overflow-hidden px-4 py-12 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_25%,rgba(139,92,246,0.22),transparent_34%),radial-gradient(circle_at_15%_75%,rgba(59,130,246,0.12),transparent_30%)]" />
        <div className="mx-auto grid min-h-[calc(100vh-172px)] max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-purple-200">
              <Sparkles className="h-3.5 w-3.5" />
              From idea to video in one conversation
            </div>
            <h1 className="font-display text-4xl font-black leading-[0.96] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Make the next
              <span className="block bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">scroll-stopping story.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-gray-300 sm:text-lg lg:mx-0">
              Tell Qoneqt what you want to say. The AI plans the script, finds visuals, creates a voiceover, and produces a vertical video ready to publish.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
              <button
                type="button"
                onClick={scrollToChat}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-purple-600/25 transition hover:-translate-y-0.5 hover:shadow-purple-500/45"
              >
                Start a video
                <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </button>
              <button type="button" onClick={scrollToChat} className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:text-white">
                See how it works <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-9 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-400 lg:justify-start">
              {['Script & storyboard', 'Voiceover & captions', '9:16 ready to publish'].map((item) => (
                <span key={item} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />{item}</span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto h-[420px] w-full max-w-[620px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#120f17] shadow-2xl shadow-purple-950/50 sm:h-[540px]">
            <DitherVeil
              src="https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop"
              pattern="floyd"
              pixelSize={2}
              inkColor="#120f17"
              paperColor="#f4f1ea"
              revealRadius={200}
              softness={0.6}
              linger={1}
              fit="contain"
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#120f17]/85 via-[#120f17]/20 to-transparent p-6 pt-20">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-200">Touch to reveal</p>
              <p className="mt-1 text-sm text-white">Every prompt starts with a spark.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="video-generation-chat" className="scroll-mt-24 border-y border-gray-800/80 bg-[#0e1320] px-4 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <span className="inline-flex rounded-lg bg-indigo-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300">Video generation chat</span>
            <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">What should we create?</h2>
            <p className="mt-3 max-w-md leading-7 text-gray-400">Describe your idea naturally. We’ll take it into the studio with your prompt ready to generate.</p>
          </div>

          <div className="glass-panel rounded-3xl border border-gray-700/80 p-4 shadow-2xl shadow-black/20 sm:p-5">
            <div className="mb-5 flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600"><Bot className="h-4 w-4 text-white" /></div>
              <div className="rounded-2xl rounded-tl-sm bg-gray-900 px-4 py-3 text-sm leading-6 text-gray-200">I’m ready. Give me a topic, audience, or rough idea and I’ll turn it into a publishable short.</div>
            </div>
            <form onSubmit={submitPrompt} className="rounded-2xl border border-gray-700 bg-[#0a0e18] p-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500">
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} aria-label="Describe the video to create" className="w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-gray-500" placeholder="E.g. a 30-second launch video for our new productivity app" />
              <div className="flex items-center justify-between gap-3 px-1 pt-1">
                <span className="hidden text-xs text-gray-500 sm:inline">You can refine style, duration, and language next.</span>
                <button type="submit" className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide text-white transition hover:brightness-110">
                  <Wand2 className="h-3.5 w-3.5" /> Open generator <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
