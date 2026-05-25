import { useEffect, useRef, useState } from "react";
import dialogueData from "../tutor/dialogue.json";

/**
 * VoicePreview — QA sandbox for Freddy's voice.
 *
 * Lives at `/preview/voice`. Lists every line in `dialogue.json` grouped
 * by beat, with per-row playback so the voice can be auditioned without
 * walking through the whole lesson. Use this when A/B testing voices, or
 * after running `npm run generate-voice` to sanity-check all MP3s.
 *
 * Playback modes (per row):
 *   - "Static segments" — plays the pre-generated MP3s only (no /api/voice
 *     call). Works in `npm run dev`, `vercel dev`, and prod.
 *   - "With name" — full stitched playback including the runtime name MP3.
 *     Requires `vercel dev` locally (or prod) because Vite alone doesn't
 *     serve Edge Functions.
 */

const AUDIO_BASE = "/lessons/freddy-fractions/audio";
const NAME_PLACEHOLDER = "{{NAME}}";

type LineKey = keyof typeof dialogueData.lines;

interface LineMeta {
  key: LineKey;
  raw: string;
  hasName: boolean;
  /** Static MP3 filenames to play in order (no name segment). */
  staticSegments: string[];
}

function buildMeta(key: LineKey, raw: string): LineMeta {
  const hasName = raw.includes(NAME_PLACEHOLDER);
  if (!hasName) {
    return { key, raw, hasName, staticSegments: [`${key}.mp3`] };
  }
  const idx = raw.indexOf(NAME_PLACEHOLDER);
  const before = raw.slice(0, idx).trim();
  const after = raw.slice(idx + NAME_PLACEHOLDER.length).trim();
  const segments: string[] = [];
  if (before.length > 0) segments.push(`${key}_a.mp3`);
  if (after.length > 0) segments.push(`${key}_b.mp3`);
  return { key, raw, hasName, staticSegments: segments };
}

function groupOf(key: string): string {
  if (key.startsWith("onboarding_")) return "Onboarding";
  if (key.startsWith("aha_")) return "Beat 6 — AHA";
  return "Other";
}

const ALL_LINES: LineMeta[] = (
  Object.entries(dialogueData.lines) as [LineKey, string][]
).map(([k, v]) => buildMeta(k, v));

const GROUPS: { name: string; lines: LineMeta[] }[] = (() => {
  const map = new Map<string, LineMeta[]>();
  for (const line of ALL_LINES) {
    const g = groupOf(line.key);
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(line);
  }
  return Array.from(map, ([name, lines]) => ({ name, lines }));
})();

export function VoicePreview() {
  const [name, setName] = useState("Jason");
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop whatever's playing on unmount.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function stopCurrent() {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingKey(null);
  }

  async function playSequence(rowId: string, urls: string[]): Promise<void> {
    stopCurrent();
    setPlayingKey(rowId);
    for (const url of urls) {
      if (playingKey !== null && playingKey !== rowId) return;
      const audio = new Audio(url);
      audioRef.current = audio;
      try {
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () =>
            reject(new Error(`failed to load ${url}`));
          audio.play().catch(reject);
        });
      } catch (err) {
        console.warn(`[VoicePreview] ${err}`);
        break;
      }
    }
    if (audioRef.current === null) return;
    setPlayingKey(null);
    audioRef.current = null;
  }

  async function playWithName(line: LineMeta): Promise<void> {
    if (!line.hasName) return playSequence(line.key, [`${AUDIO_BASE}/${line.key}.mp3`]);
    const rowId = `${line.key}-named`;
    stopCurrent();
    setPlayingKey(rowId);
    // Fetch the name MP3 once, then stitch the same way AudioEngine would.
    let nameUrl: string | null = null;
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`/api/voice returned ${res.status}`);
      const blob = await res.blob();
      nameUrl = URL.createObjectURL(blob);
    } catch (err) {
      console.warn(`[VoicePreview] /api/voice unreachable — ${err}`);
      setPlayingKey(null);
      window.alert(
        `Couldn't fetch /api/voice (${err instanceof Error ? err.message : err}). ` +
          `Use \`vercel dev\` (not \`npm run dev\`) to test name stitching locally.`,
      );
      return;
    }

    const sequence: string[] = [];
    const idx = line.raw.indexOf(NAME_PLACEHOLDER);
    if (idx > 0) sequence.push(`${AUDIO_BASE}/${line.key}_a.mp3`);
    sequence.push(nameUrl);
    if (idx + NAME_PLACEHOLDER.length < line.raw.length)
      sequence.push(`${AUDIO_BASE}/${line.key}_b.mp3`);

    await playSequence(rowId, sequence);
    URL.revokeObjectURL(nameUrl);
  }

  return (
    <main className="min-h-screen w-full bg-mozzarella-100 px-6 py-10 md:px-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-terracotta-600">
            Voice Preview
          </h1>
          <p className="text-terracotta-500 mt-2 max-w-3xl">
            Every line from{" "}
            <code className="text-terracotta-600 bg-mozzarella-50 px-1 rounded">
              src/lessons/freddy-fractions/tutor/dialogue.json
            </code>
            . Use{" "}
            <strong>Static</strong> to audition the voice without runtime name
            stitching (works everywhere), or <strong>With name</strong> to hear
            the full stitched playback (requires <code>vercel dev</code> or
            production — Vite alone doesn't serve Edge Functions).
          </p>
        </header>

        <section className="mb-8 bg-mozzarella-50 rounded-2xl p-5 shadow-sm">
          <label
            htmlFor="voice-preview-name"
            className="block text-sm font-medium text-terracotta-600 mb-1"
          >
            Test name (used for "With name" playback + rendered preview text)
          </label>
          <input
            id="voice-preview-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
            className="w-full max-w-xs text-lg font-display py-2 px-3 rounded-xl bg-white border-2 border-terracotta-200 focus:border-terracotta-400 focus:outline-none text-terracotta-600"
          />
        </section>

        {GROUPS.map((group) => (
          <section key={group.name} className="mb-10">
            <h2 className="font-display text-2xl text-terracotta-600 mb-4">
              {group.name}
            </h2>
            <div className="space-y-3">
              {group.lines.map((line) => {
                const rendered = line.hasName
                  ? line.raw.split(NAME_PLACEHOLDER).join(name || "___")
                  : line.raw;
                const isStaticPlaying = playingKey === line.key;
                const isNamedPlaying = playingKey === `${line.key}-named`;
                return (
                  <article
                    key={line.key}
                    className="bg-mozzarella-50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-start gap-3 md:gap-5"
                  >
                    <div className="flex-1 min-w-0">
                      <code className="text-xs font-mono text-terracotta-400 block mb-1">
                        {line.key}
                        {line.hasName && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-tomato-100 text-tomato-600 text-[10px] font-sans uppercase tracking-wide">
                            name slot
                          </span>
                        )}
                      </code>
                      <p className="text-terracotta-600 font-display text-base leading-snug">
                        {rendered}
                      </p>
                      {line.hasName && (
                        <p className="text-xs text-terracotta-400 mt-1">
                          Raw: <code>{line.raw}</code>
                        </p>
                      )}
                      <p className="text-[11px] font-mono text-terracotta-400 mt-1">
                        Files:{" "}
                        {line.staticSegments
                          .map((s) => s.replace(".mp3", ""))
                          .join(" → ")}
                      </p>
                    </div>
                    <div className="flex flex-row gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          isStaticPlaying
                            ? stopCurrent()
                            : playSequence(
                                line.key,
                                line.staticSegments.map(
                                  (s) => `${AUDIO_BASE}/${s}`,
                                ),
                              )
                        }
                        className={`px-3 py-2 rounded-xl font-display text-sm shadow-sm transition focus:outline-none focus:ring-4 ${
                          isStaticPlaying
                            ? "bg-tomato-500 text-white focus:ring-tomato-400/40"
                            : "bg-white border-2 border-terracotta-300 text-terracotta-600 hover:bg-terracotta-50 focus:ring-terracotta-300/40"
                        }`}
                      >
                        {isStaticPlaying ? "■ Stop" : "▶ Static"}
                      </button>
                      {line.hasName && (
                        <button
                          type="button"
                          onClick={() =>
                            isNamedPlaying ? stopCurrent() : playWithName(line)
                          }
                          disabled={!name.trim()}
                          className={`px-3 py-2 rounded-xl font-display text-sm shadow-sm transition focus:outline-none focus:ring-4 disabled:opacity-40 disabled:cursor-not-allowed ${
                            isNamedPlaying
                              ? "bg-tomato-500 text-white focus:ring-tomato-400/40"
                              : "bg-white border-2 border-terracotta-300 text-terracotta-600 hover:bg-terracotta-50 focus:ring-terracotta-300/40"
                          }`}
                        >
                          {isNamedPlaying ? "■ Stop" : "▶ With name"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <footer className="text-center text-xs text-terracotta-400 mt-10">
          {ALL_LINES.length} lines · voice{" "}
          <code>{dialogueData.voice.voiceId}</code> · provider{" "}
          {dialogueData.voice.provider}
        </footer>
      </div>
    </main>
  );
}
