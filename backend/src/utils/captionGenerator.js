import fs from 'fs';
import path from 'path';

/**
 * Format seconds into ASS timestamp format: H:MM:SS.cs (e.g. 0:00:04.25)
 */
function formatAssTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centisecs = Math.floor((seconds % 1) * 100);

  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${hrs}:${pad(mins)}:${pad(secs)}.${pad(centisecs)}`;
}

/**
 * Format seconds into SRT timestamp format: HH:MM:SS,mmm
 */
function formatSrtTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(millis, 3)}`;
}

/**
 * Breaks long text into short 3-6 word bite-sized punchy lines for short-form mobile video
 */
export function chunkTextForMobile(text, maxWordsPerLine = 5) {
  if (!text) return [];
  const words = text.replace(/[\r\n]+/g, ' ').trim().split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += maxWordsPerLine) {
    chunks.push(words.slice(i, i + maxWordsPerLine).join(' '));
  }
  return chunks;
}

/**
 * Generates an ASS subtitle file optimized for 1080x1920 9:16 vertical videos.
 * Features:
 * - 1080x1920 PlayRes
 * - Bold modern typeface with yellow highlight keywords and dark stroke
 * - Center-bottom alignment positioned strictly within safe mobile viewing zones
 */
export function generateAssFile(scenes, outputPath, options = {}) {
  const {
    fontName = 'Arial',
    fontSize = 58,
    primaryColor = '&H00FFFFFF',     // BGR format in ASS: White (&H00FFFFFF)
    secondaryColor = '&H0000FFFF',   // Yellow (&H0000FFFF)
    outlineColor = '&H00000000',     // Black outline
    backColor = '&H80000000',        // Semi-transparent box (&H80000000)
    outlineWidth = 3.5,
    shadowDepth = 2,
    marginV = 280,                   // Vertical margin from bottom (safe zone for mobile UI)
  } = options;

  let header = `[Script Info]
; Script generated for Qoneqt Video Studio
Title: Qoneqt AI Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},${secondaryColor},${outlineColor},${backColor},-1,0,0,0,100,100,1,0,1,${outlineWidth},${shadowDepth},2,80,80,${marginV},1
Style: Highlight,${fontName},${fontSize + 4},&H003BF5FF,&H00FFFFFF,${outlineColor},${backColor},-1,0,0,0,100,100,1,0,1,${outlineWidth + 1},${shadowDepth},2,80,80,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let currentTime = 0;
  let eventLines = [];

  for (const scene of scenes) {
    const sceneDuration = Number(scene.duration) || 5;
    const voiceover = scene.voiceover || scene.onScreenText || '';
    const chunks = chunkTextForMobile(voiceover, 5);

    if (chunks.length > 0) {
      const chunkDuration = sceneDuration / chunks.length;

      chunks.forEach((chunk, idx) => {
        const start = currentTime + (idx * chunkDuration);
        const end = Math.min(start + chunkDuration, currentTime + sceneDuration);

        // Highlight first or important words
        let styledText = chunk.toUpperCase();
        // Add subtle pop styling
        styledText = `{\\an2\\b1}${styledText}`;

        eventLines.push(`Dialogue: 0,${formatAssTime(start)},${formatAssTime(end)},Default,,0,0,0,,${styledText}`);
      });
    } else if (scene.onScreenText) {
      const start = currentTime;
      const end = currentTime + sceneDuration;
      eventLines.push(`Dialogue: 0,${formatAssTime(start)},${formatAssTime(end)},Highlight,,0,0,0,,{\\an2\\b1}${scene.onScreenText.toUpperCase()}`);
    }

    currentTime += sceneDuration;
  }

  const content = header + eventLines.join('\n') + '\n';
  fs.writeFileSync(outputPath, content, 'utf8');
  return outputPath;
}

/**
 * Generates an SRT subtitle file
 */
export function generateSrtFile(scenes, outputPath) {
  let currentTime = 0;
  let srtEntries = [];
  let index = 1;

  for (const scene of scenes) {
    const sceneDuration = Number(scene.duration) || 5;
    const voiceover = scene.voiceover || scene.onScreenText || '';
    const chunks = chunkTextForMobile(voiceover, 6);

    if (chunks.length > 0) {
      const chunkDuration = sceneDuration / chunks.length;

      chunks.forEach((chunk, idx) => {
        const start = currentTime + (idx * chunkDuration);
        const end = Math.min(start + chunkDuration, currentTime + sceneDuration);

        srtEntries.push(`${index}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${chunk}\n`);
        index++;
      });
    }

    currentTime += sceneDuration;
  }

  const content = srtEntries.join('\n');
  fs.writeFileSync(outputPath, content, 'utf8');
  return outputPath;
}
