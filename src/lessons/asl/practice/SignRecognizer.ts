/**
 * SignRecognizer — recognition contract.
 *
 * The real implementation will load an ONNX classifier and run inference
 * over MediaPipe landmark sequences. For the Tuesday demo, the
 * MockSignRecognizer below uses time-on-hand + keyboard overrides to
 * simulate recognition deterministically.
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Sign } from "../vocab";

export type RecognitionResult =
  | { kind: "no_hand" }
  | { kind: "pass"; confidence: number }
  | { kind: "fail"; confidence: number; observedSign?: Sign }
  | { kind: "uncertain"; confidence: number };

export interface SignRecognizer {
  /**
   * Observe the next frame. Called once per render-tick from the practice
   * loop with the current target sign and the latest landmarks.
   * Returns a recognition result or null if not enough signal yet.
   */
  observe(target: Sign, landmarks: NormalizedLandmark[][] | null): RecognitionResult | null;

  /** Reset internal state — call when advancing to a new sign. */
  reset(): void;

  /** Cleanup any timers/listeners. */
  dispose(): void;
}

/* ─── Mock implementation for Tuesday demo ─── */

const DEFAULT_PASS_DURATION_MS = 2500;

type ForcedResult = "pass" | "fail" | "uncertain" | null;

interface MockOptions {
  /** Milliseconds of sustained hand presence before auto-pass. Default 2500. */
  passDurationMs?: number;
  /** Disable keyboard overrides (useful for tests). Default false. */
  disableKeyboard?: boolean;
}

/**
 * Mock recognizer: returns `pass` once a hand has been continuously visible
 * for `passDurationMs`. Keyboard shortcuts force a specific result on the
 * next observe call (P=pass, F=fail, U=uncertain) — useful for the demo
 * to deliberately trigger the hint card or reference video.
 */
export class MockSignRecognizer implements SignRecognizer {
  private handFirstSeenAt: number | null = null;
  private lastEmittedKind: RecognitionResult["kind"] | null = null;
  private forced: ForcedResult = null;
  private readonly passDurationMs: number;
  private readonly keyHandler?: (e: KeyboardEvent) => void;

  constructor(opts: MockOptions = {}) {
    this.passDurationMs = opts.passDurationMs ?? DEFAULT_PASS_DURATION_MS;

    if (!opts.disableKeyboard && typeof window !== "undefined") {
      this.keyHandler = (e: KeyboardEvent) => {
        // Avoid firing while typing in form fields
        if (e.target instanceof HTMLInputElement) return;
        if (e.target instanceof HTMLTextAreaElement) return;

        const k = e.key.toLowerCase();
        if (k === "p") this.forced = "pass";
        else if (k === "f") this.forced = "fail";
        else if (k === "u") this.forced = "uncertain";
      };
      window.addEventListener("keydown", this.keyHandler);
    }
  }

  observe(
    _target: Sign,
    landmarks: NormalizedLandmark[][] | null
  ): RecognitionResult | null {
    const handDetected = !!landmarks && landmarks.length > 0;

    // Keyboard override takes precedence
    if (this.forced) {
      const forced = this.forced;
      this.forced = null;
      if (forced === "pass") {
        this.lastEmittedKind = "pass";
        return { kind: "pass", confidence: 0.95 };
      }
      if (forced === "fail") {
        this.lastEmittedKind = "fail";
        return { kind: "fail", confidence: 0.3 };
      }
      this.lastEmittedKind = "uncertain";
      return { kind: "uncertain", confidence: 0.5 };
    }

    if (!handDetected) {
      this.handFirstSeenAt = null;
      // Emit no_hand only on the transition (don't spam)
      if (this.lastEmittedKind !== "no_hand") {
        this.lastEmittedKind = "no_hand";
        return { kind: "no_hand" };
      }
      return null;
    }

    // Hand is visible — start or continue the timer
    const now = performance.now();
    if (this.handFirstSeenAt === null) {
      this.handFirstSeenAt = now;
      return null;
    }

    const elapsed = now - this.handFirstSeenAt;
    if (elapsed >= this.passDurationMs && this.lastEmittedKind !== "pass") {
      this.lastEmittedKind = "pass";
      return { kind: "pass", confidence: 0.92 };
    }

    return null;
  }

  reset(): void {
    this.handFirstSeenAt = null;
    this.lastEmittedKind = null;
    this.forced = null;
  }

  dispose(): void {
    if (this.keyHandler && typeof window !== "undefined") {
      window.removeEventListener("keydown", this.keyHandler);
    }
  }

  /** Progress 0-1 for the confidence cue. Useful only with mock. */
  getProgress(): number {
    if (this.handFirstSeenAt === null) return 0;
    const elapsed = performance.now() - this.handFirstSeenAt;
    return Math.min(1, elapsed / this.passDurationMs);
  }
}
