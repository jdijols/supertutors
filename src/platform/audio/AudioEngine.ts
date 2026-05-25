import { Howl } from "howler";
import { getNameAudioUrl } from "./nameAudioCache";
import { splitDialogueLine, type Segment } from "@/lib/dialogueSplit";

export interface PlayOptions {
  dialogueKey: string;
  onDone: () => void;
  onSpeakingChange?: (speaking: boolean) => void;
  name?: string;
  /** @deprecated kept for backward compatibility */
  hasNameSlot?: boolean;
}

export interface AudioEngineDeps {
  createHowl?: (src: string, onend: () => void, onError: () => void) => HowlLike;
  resolveNameUrl?: (name: string) => Promise<string>;
  audioBasePath?: string;
  interSegmentGapMs?: number;
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

const DEFAULT_INTER_SEGMENT_GAP_MS = 160;

interface ResolvedSegment {
  url: string;
  kind: "static" | "name";
}

export class AudioEngine {
  private readonly createHowl: NonNullable<AudioEngineDeps["createHowl"]>;
  private readonly resolveNameUrl: NonNullable<AudioEngineDeps["resolveNameUrl"]>;
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
    // No default lineLookup — must be supplied for production use.
    // Tests and lesson modules inject their own lookup.
    this.lineLookup = deps.lineLookup ?? (() => undefined);
  }

  preloadDialogue(dialogueKey: string): void {
    const segments = this.lookupSegments(dialogueKey);
    if (!segments) return;
    for (const seg of segments) {
      if (seg.kind !== "static") continue;
      const url = `${this.basePath}/${seg.filenameStem}.mp3`;
      if (this.preloaded.has(url)) continue;
      this.preloaded.add(url);
      fetch(url, { cache: "force-cache" }).catch(() => {});
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
            speak(false);
            onDone();
            return;
          }
          advanceAfterGap();
        },
        () => {
          console.warn(`[AudioEngine] segment failed: ${url}`);
          if (generation !== this.generation) return;
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
