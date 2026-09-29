import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `You are a world-class viral short-form video producer and viral scriptwriter for Qoneqt, a premier next-gen creator platform.
Your job is to transform topics, trends, or ideas into high-retention, engaging 9:16 vertical video scripts (30s - 60s).

Structure Requirements:
1. HOOK (0-3s): Attention-grabbing question or bold statement that stops the scroll.
2. VALUE / BODY: 3-5 rapid-fire points or story beats, punchy and clear.
3. CALL TO ACTION (Final 3-5s): Encourage viewers to like, comment, and follow on Qoneqt.

You MUST ALWAYS return a valid, well-formed JSON object strictly matching this schema:
{
  "title": "Short Catchy Title (max 60 chars)",
  "hook": "Scroll-stopping first sentence",
  "target_audience": "e.g. Developers, Tech Enthusiasts, Founders",
  "narration": "Full complete spoken script combining all scenes smoothly",
  "caption": "Viral post description with hook and call to action for Qoneqt feed",
  "hashtags": ["#AI", "#Tech", "#Coding", "#Future", "#Qoneqt"],
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": 5,
      "voiceover": "Spoken sentence for this 5-second scene.",
      "visualQuery": "2-4 specific descriptive keywords for stock video search (e.g. 'developer typing code dark room')",
      "visualPrompt": "Detailed visual description of what appears on screen",
      "onScreenText": "2-4 BOLD PUNCHY WORDS",
      "transition": "fade"
    }
  ]
}

DO NOT include any markdown code fencing other than standard JSON. Ensure total scenes duration equals the requested duration. Ensure each scene is between 4 and 8 seconds.`;

export class AIService {
  /**
   * Generates a structured video script using Gemini, falling back to Groq
   */
  static async generateScript({ topic, duration = 30, style = 'Educational', language = 'English' }) {
    console.log(`[AI Service] Generating script for topic: "${topic}" (${duration}s, ${style}, ${language})`);

    const userPrompt = `Generate a ${duration}-second vertical video script about: "${topic}".
Style: ${style}
Language: ${language}
Target Duration: exactly ${duration} seconds.
Calculate the scenes so the sum of scene durations equals ${duration} seconds (e.g. ${Math.round(duration / 5)} scenes of ~5s each).`;

    let result = null;
    let providerUsed = 'Gemini';

    // 1. Try Gemini API first
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== 'YOUR_GEMINI_API_KEY' && geminiKey.trim() !== '') {
      try {
        console.log('[AI Service] Calling Gemini API...');
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        
        // Try modern Gemini models with responseSchema
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          }
        });

        const rawText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text);
        if (rawText) {
          result = JSON.parse(this.cleanJsonString(rawText));
          providerUsed = 'Gemini (gemini-2.5-flash)';
        }
      } catch (geminiError) {
        console.warn(`[AI Service] Primary Gemini failed (${geminiError.message}). Attempting secondary Gemini fallback model...`);
        try {
          // Fallback to gemini-1.5-flash via REST or SDK
          const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
          const restRes = await axios.post(restUrl, {
            contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}\nReturn pure JSON only.` }] }],
            generationConfig: { temperature: 0.7 }
          }, { timeout: 15000 });

          const text = restRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            result = JSON.parse(this.cleanJsonString(text));
            providerUsed = 'Gemini (gemini-1.5-flash REST)';
          }
        } catch (restErr) {
          console.warn(`[AI Service] Secondary Gemini failed (${restErr.message}).`);
        }
      }
    }

    // 2. Fallback to Groq API if Gemini failed or key not available
    if (!result) {
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey && groqKey !== 'YOUR_GROQ_API_KEY' && groqKey.trim() !== '') {
        try {
          console.log('[AI Service] Falling back to Groq API...');
          const groq = new Groq({ apiKey: groqKey });
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.7,
          });

          const groqText = chatCompletion.choices[0]?.message?.content;
          if (groqText) {
            result = JSON.parse(this.cleanJsonString(groqText));
            providerUsed = 'Groq (llama-3.3-70b-versatile)';
          }
        } catch (groqError) {
          console.warn(`[AI Service] Groq API fallback failed: ${groqError.message}`);
        }
      }
    }

    // 3. Fallback: Intelligent procedural script builder if API keys are missing/rate-limited
    if (!result) {
      console.log('[AI Service] Using structured fallback script generator (No API keys configured or network offline).');
      result = this.generateFallbackScript(topic, duration, style);
      providerUsed = 'Built-in Intelligent Script Engine';
    }

    // Validate and normalize schema
    return this.normalizeScript(result, duration, providerUsed);
  }

  /**
   * Helper to clean JSON string from markdown wrappers
   */
  static cleanJsonString(str) {
    if (!str) return '{}';
    let cleaned = str.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  }

  /**
   * Normalizes and validates script structure
   */
  static normalizeScript(script, targetDuration, providerUsed) {
    const title = script.title || `Mastering ${script.topic || 'Innovation'}`;
    const hook = script.hook || 'Here is something you need to see today!';
    const scenes = Array.isArray(script.scenes) ? script.scenes : [];

    // Ensure scenes have appropriate durations
    let currentTotal = scenes.reduce((acc, s) => acc + (Number(s.duration) || 5), 0);
    if (currentTotal === 0 || scenes.length === 0) {
      return this.generateFallbackScript(title, targetDuration, 'Educational');
    }

    // Adjust last scene duration to match targetDuration exactly
    const diff = targetDuration - currentTotal;
    if (diff !== 0 && scenes.length > 0) {
      scenes[scenes.length - 1].duration = Math.max(3, (Number(scenes[scenes.length - 1].duration) || 5) + diff);
    }

    const narration = script.narration || scenes.map(s => s.voiceover).join(' ');

    return {
      title,
      hook,
      target_audience: script.target_audience || 'General Audience',
      narration,
      caption: script.caption || `${title} 🔥 Watch till the end and share your thoughts! #Qoneqt #Viral`,
      hashtags: Array.isArray(script.hashtags) && script.hashtags.length > 0 ? script.hashtags : ['#Qoneqt', '#AI', '#Trending', '#Tech', '#Viral'],
      duration: targetDuration,
      scenes: scenes.map((s, idx) => ({
        sceneNumber: idx + 1,
        duration: Number(s.duration) || 5,
        voiceover: s.voiceover || 'Check this out.',
        visualQuery: s.visualQuery || 'modern technology digital background',
        visualPrompt: s.visualPrompt || 'Futuristic tech animation',
        onScreenText: s.onScreenText || `STEP ${idx + 1}`,
        transition: s.transition || 'fade'
      })),
      providerUsed
    };
  }

  /**
   * Fallback script generator for 100% offline/demo resilience
   */
  static generateFallbackScript(topic, duration = 30, style = 'Educational') {
    const sceneCount = Math.max(3, Math.round(duration / 5));
    const sceneDuration = Math.round(duration / sceneCount);

    const scenes = [];
    const topicsMap = {
      '5 AI tools every developer should know in 2026': [
        { vo: 'Stop coding everything manually! Here are 5 AI tools reshaping software development in 2026.', q: 'developer coding futuristic computer', ost: '5 AI TOOLS 2026' },
        { vo: 'First: Antigravity Code Agents, which automate end-to-end fullstack architectural implementation in seconds.', q: 'cyberpunk artificial intelligence coding', ost: '1. AI AGENTS' },
        { vo: 'Second: Cursor 3 with real-time multi-file semantic awareness and automated bug eradication.', q: 'matrix code neon developer', ost: '2. SMART REFACTOR' },
        { vo: 'Third: Claude 4 Code Architect for instant production deployment and distributed systems design.', q: 'server room cloud computing', ost: '3. ARCHITECT AI' },
        { vo: 'Fourth: Devin 2.0 autonomous SWE agents handling complex repo PRs overnight with automated testing.', q: 'futuristic robot programming', ost: '4. SWE AGENTS' },
        { vo: 'Fifth: Qoneqt AI Engine, turning raw concepts into high-engagement viral video feeds in one click!', q: 'viral social media feed mobile phone', ost: '5. QONEQT AI' }
      ]
    };

    const preset = topicsMap[topic] || [
      { vo: `Are you ready to discover the future of ${topic}? Let's dive in right now.`, q: `${topic} innovation technology`, ost: 'THE FUTURE' },
      { vo: `Key breakthrough number one: high-speed AI automation that removes 90% of manual effort.`, q: 'digital transformation abstract particle', ost: '10X FASTER' },
      { vo: `Next: multimodal reasoning that understands code, video, and design simultaneously.`, q: 'data visualization neural network', ost: 'MULTIMODAL' },
      { vo: `Furthermore, autonomous workflow orchestration allows instant scale with zero friction.`, q: 'high tech server cloud futuristic', ost: 'ZERO FRICTION' },
      { vo: `Finally, smart creator platforms like Qoneqt empower you to broadcast directly to the world!`, q: 'creator streaming mobile phone audience', ost: 'PUBLISH ON QONEQT' },
      { vo: `Follow for more cutting-edge insights and create your own content on Qoneqt today!`, q: 'success celebration futuristic light', ost: 'JOIN QONEQT' }
    ];

    let timeAcc = 0;
    for (let i = 0; i < sceneCount; i++) {
      const p = preset[i % preset.length];
      const d = (i === sceneCount - 1) ? (duration - timeAcc) : sceneDuration;
      timeAcc += d;
      scenes.push({
        sceneNumber: i + 1,
        duration: d,
        voiceover: p.vo,
        visualQuery: p.q,
        visualPrompt: `High quality vertical video representing ${p.q}`,
        onScreenText: p.ost,
        transition: i % 2 === 0 ? 'fade' : 'crossfade'
      });
    }

    return {
      title: `${topic.slice(0, 45)} (2026 Edition)`,
      hook: `Still doing everything manually? Here is the ultimate breakdown of ${topic}!`,
      target_audience: 'Developers, Tech Enthusiasts, Modern Creators',
      narration: scenes.map(s => s.voiceover).join(' '),
      caption: `Discover ${topic} in 2026! 🚀 The future is here on Qoneqt. Like & follow for daily breakthrough insights! #Qoneqt #AI #Future #Tech`,
      hashtags: ['#Qoneqt', '#AI2026', '#Developer', '#TechTrends', '#Future'],
      duration,
      scenes,
      providerUsed: 'Built-in Intelligent Script Engine'
    };
  }
}

export default AIService;
