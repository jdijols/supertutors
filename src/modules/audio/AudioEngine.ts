import { Howl } from "howler";

/**
 * AudioEngine — wraps Howler.js.
 *
 * Two playback modes (see PRD §3.11):
 *   1) Static line: plays a single pre-generated MP3 keyed by dialogue ID.
 *   2) Name-injected line: sequential queue [pre-gen A] -> [name MP3] -> [pre-gen B].
 *
 * Global fallback: if any MP3 fails to load (network, missing file), we
 * fire onDialogueDone immediately so the state machine never blocks on audio.
 *
 * Stubbed for scaffold — wiring to dialogue.json + IndexedDB name cache
 * happens once Beat 5 voice MP3s are generated via scripts/generate-voice.ts.
 */

export interface PlayOptions {
  dialogueKey: string;
  onDone: () => void;
}

class AudioEngineImpl {
  private current: Howl | null = null;

  play({ dialogueKey, onDone }: PlayOptions): void {
    // TODO: resolve dialogueKey -> /public/audio/<key>.mp3 (and name MP3 if {{NAME}} in line)
    // For scaffold: simulate dialogue duration so the state machine progresses
    console.info(`[AudioEngine] (stub) would play "${dialogueKey}"`);
    const fakeDurationMs = 1500;
    window.setTimeout(onDone, fakeDurationMs);
  }

  stop(): void {
    this.current?.stop();
    this.current = null;
  }
}

export const audioEngine = new AudioEngineImpl();
