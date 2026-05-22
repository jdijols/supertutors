import { Howl } from "howler";
import { getNameAudioUrl } from "./nameAudioCache";
import dialogueData from "@/modules/tutor/dialogue.json";
import { splitDialogueLine, type Segment } from "@/lib/dialogueSplit";

/**
 * AudioEngine — sequential MP3 playback wrapped around Howler.js.
 *
 * Given a dialogue key, the engine looks up the line text, splits it into
 * playback segments via `splitDialogueLine` (sentence-aware), and plays
 * them in order. Between every pair of segments — both the sentence
 * boundaries WITHIN a line AND the static/name boundary for personalized
 * lines — it fires `onSpeakingChange(false)` for a brief gap, then
 * `onSpeakingChange(true)` and the next segment. That gap is what
 * produces the visible mouth-close beat at every period when paired with
 * a `speaking`-driven `FreddyCharacter`.
 *
 * Failure semantics: if any single segment fails to load or play, we
 * skip to the next instead of aborting the whole line. The name segment
 * specifically is best-effort — if `/api/voice` is unavailable, the
 * static halves still play (kid hears everything except the name).
 *
 * See PRD §3.11 Audio Architecture.
 */

export interface PlayOptions {
  /** Dialogue key — must be a key in dialogue.json. */
  dialogueKey: string;
  /** Fires after the final segment ends — or immediately on any failure. */
  onDone: () => void;
  /**
   * Called true/false as the engine transitions between segments and at
   * the end of the line. Wire this to your mouth/speaking display so
   * the mouth closes at every sentence boundary and on overall completion.
   */
  onSpeakingChange?: (speaking: boolean) => void;
  /** Kid's name — required when the line contains {{NAME}}. */
  name?: string;
  /**
   * @deprecated Inferred from the dialogue line; kept for backward
   * compatibility with call sites that haven't migrated yet.
   */
  hasNameSlot?: boolean;
}

export interface AudioEngineDeps {
  /** Override Howl construction for tests. */
  createHowl?: (src: string, onend: () => void, onError: () => void) => HowlLike;
  /** Override the name-audio resolver for tests. */
  resolveNameUrl?: (name: string) => Promise<string>;
  /** Override the base path for pre-generated MP3s. */
  audioBasePath?: string;
  /** Override the inter-segment pause (ms). */
  interSegmentGapMs?: number;
  /** Inject dialogue text source (defaults to bundled dialogue.json). */
  lineLookup?: (key: string) => string | undefined;
}

export interface HowlLike {
  play: () => void;
  stop: () => void;
}

const defaultCreateHowl = (
  src: string,
  onend: () => void,
  onError: () => void,
): HowlLike => {
  const howl = new Howl({
    src: [src],
    format: ["mp3"],
    html5: true,
    onend,
    onloaderror: onError,
    onplayerror: onError,
  });
  return howl;
};

/**
 * Default inter-segment pause. Tuned to be perceptible (kid sees the
 * mouth close at every period) without dragging the pacing. Bump if
 * lines start feeling rushed; trim if they start feeling stilted.
 */
const DEFAULT_INTER_SEGMENT_GAP_MS = 160;

interface ResolvedSegment {
  url: string;
  /** Whether this URL represents a static MP3 or the runtime name MP3. */
  kind: "static" | "name";
}

export class AudioEngine {
  private readonly createHowl: NonNullable<AudioEngineDeps["createHowl"]>;
  private readonly resolveNameUrl: NonNullable<
    AudioEngineDeps["resolveNameUrl"]
  >;
  private readonly basePath: string;
  private readonly gapMs: number;
  private readonly lineLookup: (key: string) => string | undefined;
  private active: HowlLike[] = [];
  private generation = 0;
  private preloaded: Set<string> = new Set();
  private gapTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(deps: AudioEngineDeps = {}) {
    this.createHowl = deps.createHowl ?? defaultCreateHowl;
    this.resolveNameUrl =
      deps.resolveNameUrl ?? ((name) => getNameAudioUrl(name));
    this.basePath = deps.audioBasePath ?? "/audio";
    this.gapMs = deps.interSegmentGapMs ?? DEFAULT_INTER_SEGMENT_GAP_MS;
    this.lineLookup =
      deps.lineLookup ??
      ((key) =>
        (dialogueData.lines as Record<string, string>)[key]);
  }

  /**
   * Prime the HTTP cache for a dialogue key's MP3(s) so playback starts
   * with minimal latency. Walks the line's static segments and prefetches
   * each one. Name segment is fetched/cached separately by getNameAudioUrl.
   */
  preloadDialogue(dialogueKey: string): void {
    const segments = this.lookupSegments(dialogueKey);
    if (!segments) return;
    for (const seg of segments) {
      if (seg.kind !== "static") continue;
      const url = `${this.basePath}/${seg.filenameStem}.mp3`;
      if (this.preloaded.has(url)) continue;
      this.preloaded.add(url);
      fetch(url, { cache: "force-cache" }).catch(() => {
        /* ignore — preload is best-effort */
      });
    }
  }

  async play(opts: PlayOptions): Promise<void> {
    this.stop();
    const generation = ++this.generation;
    const speak = opts.onSpeakingChange ?? (() => {});
    const done = () => {
      if (generation === this.generation) opts.onDone();
    };

    const urls = await this.resolveUrls(opts).catch(() => null);
    if (!urls || urls.length === 0) {
      speak(false);
      done();
      return;
    }
    if (generation !== this.generation) return;
    this.playSequence(urls, speak, done, generation);
  }

  stop(): void {
    this.generation++;
    if (this.gapTimer) {
      clearTimeout(this.gapTimer);
      this.gapTimer = null;
    }
    for (const h of this.active) {
      try {
        h.stop();
      } catch {
        /* swallow — Howler can throw if already destroyed */
      }
    }
    this.active = [];
  }

  private lookupSegments(key: string): Segment[] | null {
    const text = this.lineLookup(key);
    if (text === undefined) {
      console.warn(`[AudioEngine] unknown dialogue key: ${key}`);
      return null;
    }
    return splitDialogueLine(key, text).segments;
  }

  private async resolveUrls(opts: PlayOptions): Promise<ResolvedSegment[]> {
    const segments = this.lookupSegments(opts.dialogueKey);
    if (!segments) return [];

    const out: ResolvedSegment[] = [];
    for (const seg of segments) {
      if (seg.kind === "static") {
        out.push({
          kind: "static",
          url: `${this.basePath}/${seg.filenameStem}.mp3`,
        });
      } else {
        // Name segment — resilient: if /api/voice is unreachable (vite
        // dev with no shim, prod hiccup), skip the name and keep the
        // surrounding statics. Better than aborting the whole line.
        if (!opts.name) {
          throw new Error(
            `name required when playing "${opts.dialogueKey}" (line has {{NAME}})`,
          );
        }
        try {
          const nameUrl = await this.resolveNameUrl(opts.name);
          out.push({ kind: "name", url: nameUrl });
        } catch (err) {
          console.warn(
            `[AudioEngine] name fetch failed for "${opts.name}" — skipping name segment`,
            err,
          );
        }
      }
    }
    return out;
  }

  private playSequence(
    urls: ResolvedSegment[],
    speak: (speaking: boolean) => void,
    onDone: () => void,
    generation: number,
  ): void {
    let i = 0;

    const playNext = () => {
      if (generation !== this.generation) return;
      if (i >= urls.length) {
        speak(false);
        onDone();
        return;
      }
      speak(true);
      const url = urls[i++].url;
      const advanceAfterGap = () => {
        // Mid-line boundary — close the mouth for the gap, then start
        // the next segment. The gap is what makes the period audible
        // as a beat. When gap is 0 (tests), skip the timer entirely so
        // the chain plays synchronously and tests don't need fake timers.
        speak(false);
        if (this.gapMs <= 0) {
          playNext();
          return;
        }
        this.gapTimer = setTimeout(() => {
          this.gapTimer = null;
          playNext();
        }, this.gapMs);
      };

      const howl = this.createHowl(
        url,
        () => {
          if (generation !== this.generation) return;
          if (i >= urls.length) {
            // Last segment — wrap up without an artificial gap.
            speak(false);
            onDone();
            return;
          }
          advanceAfterGap();
        },
        () => {
          console.warn(`[AudioEngine] segment failed: ${url}`);
          if (generation !== this.generation) return;
          // Treat as end of this segment — close briefly, then continue.
          if (i >= urls.length) {
            speak(false);
            onDone();
            return;
          }
          advanceAfterGap();
        },
      );
      this.active.push(howl);
      howl.play();
    };

    playNext();
  }
}

export const audioEngine = new AudioEngine();
