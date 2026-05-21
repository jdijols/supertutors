import { Howl } from "howler";
import { getNameAudioUrl } from "./nameAudioCache";

/**
 * AudioEngine — sequential MP3 playback wrapped around Howler.js.
 *
 * Two modes (PRD §3.11):
 *   1) Static line: a single pre-generated MP3 (`/audio/<key>.mp3`).
 *   2) Name-injected line: queue [pre-gen A] → [name MP3] → [pre-gen B]
 *      where the name MP3 comes from IndexedDB (cached) or /api/voice.
 *
 * Failure semantics: if any segment fails to load or play, we fire `onDone`
 * immediately so the state machine never hangs on audio. PRD §4.4 global
 * fallback: missing audio == treat dialogue as complete.
 */

export interface PlayOptions {
  /** Dialogue key, matches a file under /public/audio/ */
  dialogueKey: string;
  /** Fires after the final segment ends — or immediately on any failure. */
  onDone: () => void;
  /** If true, expects `<key>_a.mp3` + `<key>_b.mp3` plus a name segment. */
  hasNameSlot?: boolean;
  /** Kid's name — required when hasNameSlot is true. */
  name?: string;
}

export interface AudioEngineDeps {
  /** Override Howl construction for tests. */
  createHowl?: (src: string, onend: () => void, onError: () => void) => HowlLike;
  /** Override the name-audio resolver for tests. */
  resolveNameUrl?: (name: string) => Promise<string>;
  /** Override the base path for pre-generated MP3s. */
  audioBasePath?: string;
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

export class AudioEngine {
  private readonly createHowl: NonNullable<AudioEngineDeps["createHowl"]>;
  private readonly resolveNameUrl: NonNullable<
    AudioEngineDeps["resolveNameUrl"]
  >;
  private readonly basePath: string;
  private active: HowlLike[] = [];
  private generation = 0;
  private preloaded: Set<string> = new Set();

  constructor(deps: AudioEngineDeps = {}) {
    this.createHowl = deps.createHowl ?? defaultCreateHowl;
    this.resolveNameUrl =
      deps.resolveNameUrl ?? ((name) => getNameAudioUrl(name));
    this.basePath = deps.audioBasePath ?? "/audio";
  }

  /**
   * Prime the HTTP cache for a dialogue key's MP3(s) so the beat's first
   * line plays with minimal latency. Call from the preceding beat's
   * DIALOGUE_DONE handler. Name-slotted lines: pass `hasNameSlot: true`
   * to prefetch the flanking `_a` + `_b` segments (the name audio itself
   * is fetched/cached separately by getNameAudioUrl).
   *
   * Uses `fetch()` with `cache: 'force-cache'` — no Howl objects created,
   * no audio decoded — just warms the browser HTTP cache so Howler's later
   * XHR/HTML5 load is a cache hit.
   */
  preloadDialogue(dialogueKey: string, opts?: { hasNameSlot?: boolean }): void {
    const urls = opts?.hasNameSlot
      ? [
          `${this.basePath}/${dialogueKey}_a.mp3`,
          `${this.basePath}/${dialogueKey}_b.mp3`,
        ]
      : [`${this.basePath}/${dialogueKey}.mp3`];

    for (const url of urls) {
      if (this.preloaded.has(url)) continue;
      this.preloaded.add(url);
      fetch(url, { cache: 'force-cache' }).catch(() => { /* ignore — preload is best-effort */ });
    }
  }

  async play(opts: PlayOptions): Promise<void> {
    this.stop();
    const generation = ++this.generation;
    const done = () => {
      if (generation === this.generation) opts.onDone();
    };

    const segments = await this.resolveSegments(opts).catch(() => null);
    if (!segments) {
      done();
      return;
    }
    if (generation !== this.generation) return;
    this.playSequence(segments, done, generation);
  }

  stop(): void {
    this.generation++;
    for (const h of this.active) {
      try {
        h.stop();
      } catch {
        /* swallow — Howler can throw if already destroyed */
      }
    }
    this.active = [];
  }

  private async resolveSegments(opts: PlayOptions): Promise<string[]> {
    if (opts.hasNameSlot) {
      if (!opts.name) {
        throw new Error("name required when hasNameSlot is true");
      }
      const nameUrl = await this.resolveNameUrl(opts.name);
      return [
        `${this.basePath}/${opts.dialogueKey}_a.mp3`,
        nameUrl,
        `${this.basePath}/${opts.dialogueKey}_b.mp3`,
      ];
    }
    return [`${this.basePath}/${opts.dialogueKey}.mp3`];
  }

  private playSequence(
    urls: string[],
    onDone: () => void,
    generation: number,
  ): void {
    let i = 0;
    const next = () => {
      if (generation !== this.generation) return;
      if (i >= urls.length) {
        onDone();
        return;
      }
      const url = urls[i++];
      const howl = this.createHowl(url, next, () => {
        console.warn(`[AudioEngine] segment failed: ${url}`);
        next();
      });
      this.active.push(howl);
      howl.play();
    };
    next();
  }
}

export const audioEngine = new AudioEngine();
