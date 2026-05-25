/**
 * OnnxSignRecognizer — real sign recognition backed by the trained ONNX model.
 *
 * Replaces MockSignRecognizer once the ONNX pipeline has been run:
 *   ASL-ComputerVision/training/run_pipeline.sh
 *
 * Model I/O contract (from export_onnx.py):
 *   Input:  float_input  [1, 63]  float32  — 21 normalized landmarks × (x, y, z)
 *   Output: probabilities [1, 9]  float32  — 8 signs + BACKGROUND class
 *
 * The recognizer runs async inference on every frame but returns results
 * synchronously via a one-frame-latent pending-result queue. The 1-frame
 * lag is imperceptible at 30fps and avoids blocking the render loop.
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Sign } from "../vocab";
import type { RecognitionResult, SignRecognizer } from "./SignRecognizer";

const MODEL_URL = "/lessons/asl/model/asl_classifier.onnx";
const LABEL_MAP_URL = "/lessons/asl/model/label_map.json";

/** Minimum probability on the correct class to emit a "pass". */
const PASS_THRESHOLD = 0.72;

/** Minimum probability on any non-background class to emit a "fail" (vs "uncertain"). */
const FAIL_THRESHOLD = 0.55;

/** Rolling average window for temporal smoothing. */
const SMOOTH_FRAMES = 6;

/** Consecutive smoothed frames above PASS_THRESHOLD before emitting "pass". */
const PASS_HOLD_FRAMES = 8;   // ~267ms at 30fps

interface LabelMap {
  labels: string[];
  background_idx: number;
  feature_dim: number;
}

/** Normalize 21 MediaPipe Hands landmarks to match the training preprocessing. */
function normalizeLandmarks(landmarks: NormalizedLandmark[]): Float32Array {
  // Translate so wrist (landmark 0) is at origin
  const wx = landmarks[0].x;
  const wy = landmarks[0].y;
  const wz = landmarks[0].z;

  const translated = landmarks.map((lm) => ({
    x: lm.x - wx,
    y: lm.y - wy,
    z: lm.z - wz,
  }));

  // Scale: distance from wrist to middle-finger MCP (landmark 9) = 1.0
  const { x: mx, y: my, z: mz } = translated[9];
  let refDist = Math.sqrt(mx * mx + my * my + mz * mz);
  if (refDist < 1e-6) {
    refDist = Math.max(...translated.map(({ x, y, z }) => Math.sqrt(x * x + y * y + z * z))) || 1;
  }
  const scale = 1.0 / refDist;

  const flat = new Float32Array(63);
  for (let i = 0; i < 21; i++) {
    flat[i * 3 + 0] = translated[i].x * scale;
    flat[i * 3 + 1] = translated[i].y * scale;
    flat[i * 3 + 2] = translated[i].z * scale;
  }
  return flat;
}

export class OnnxSignRecognizer implements SignRecognizer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private session: any | null = null;
  private labelMap: LabelMap | null = null;
  private loadError: string | null = null;

  /** Ring buffer of recent probability arrays for temporal smoothing. */
  private readonly probBuffer: Float32Array[] = [];
  private passHoldCount = 0;
  private lastEmittedKind: RecognitionResult["kind"] | null = null;

  /** Result resolved from the most-recent async inference cycle. */
  private pendingResult: RecognitionResult | null = null;

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const ort = await import("onnxruntime-web");
      // Point to the WASM files that were copied to /public
      ort.env.wasm.wasmPaths = "/";
      this.session = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ["wasm"],
      });
      const resp = await fetch(LABEL_MAP_URL);
      this.labelMap = (await resp.json()) as LabelMap;
    } catch (err) {
      this.loadError = String(err);
      console.error("[OnnxSignRecognizer] Failed to load model:", err);
    }
  }

  private async runInference(flat: Float32Array): Promise<void> {
    if (!this.session || !this.labelMap) return;

    try {
      const ort = await import("onnxruntime-web");
      const tensor = new ort.Tensor("float32", flat, [1, 63]);
      const outputs = await this.session.run({ float_input: tensor });

      // skl2onnx: index 0 = predicted label, index 1 = probabilities map
      // We converted with zipmap:False so index 1 is a raw Float32Array
      const outputKeys = Object.keys(outputs);
      const probKey = outputKeys.find((k) => outputs[k].dims[1] === this.labelMap!.labels.length)
        ?? outputKeys[1];
      const probs = outputs[probKey].data as Float32Array;

      // Temporal smoothing
      this.probBuffer.push(Float32Array.from(probs));
      if (this.probBuffer.length > SMOOTH_FRAMES) this.probBuffer.shift();

      const n = this.probBuffer.length;
      const smoothed = new Float32Array(probs.length);
      for (const p of this.probBuffer) {
        for (let i = 0; i < p.length; i++) smoothed[i] += p[i] / n;
      }

      this.pendingResult = this.classify(smoothed);
    } catch {
      // Silent — inference error on one frame isn't fatal
    }
  }

  private classify(smoothed: Float32Array): RecognitionResult {
    const { labels, background_idx } = this.labelMap!;

    // Find best non-background class
    let bestIdx = -1;
    let bestProb = 0;
    for (let i = 0; i < smoothed.length; i++) {
      if (i === background_idx) continue;
      if (smoothed[i] > bestProb) {
        bestProb = smoothed[i];
        bestIdx = i;
      }
    }

    const bgProb = smoothed[background_idx];

    // Background dominates → uncertain
    if (bgProb > bestProb || bestProb < FAIL_THRESHOLD) {
      this.passHoldCount = 0;
      return { kind: "uncertain", confidence: bestProb };
    }

    // We'll resolve target-match in observe(), where we have the target sign
    // Store the best label and prob in the pending result for observe() to read
    (this as { _bestLabel?: string; _bestProb?: number })._bestLabel = labels[bestIdx];
    (this as { _bestLabel?: string; _bestProb?: number })._bestProb = bestProb;
    return { kind: "uncertain", confidence: bestProb };   // placeholder; observe() will upgrade
  }

  observe(target: Sign, landmarks: NormalizedLandmark[][] | null): RecognitionResult | null {
    // Model loading failed — return uncertain so the UI doesn't hang
    if (this.loadError) return { kind: "uncertain", confidence: 0 };

    if (!landmarks || landmarks.length === 0) {
      this.passHoldCount = 0;
      this.probBuffer.length = 0;
      if (this.lastEmittedKind !== "no_hand") {
        this.lastEmittedKind = "no_hand";
        this.pendingResult = null;
        return { kind: "no_hand" };
      }
      return null;
    }

    // Fire inference async for the NEXT frame
    const flat = normalizeLandmarks(landmarks[0]);
    void this.runInference(flat);

    // Return the result from the PREVIOUS inference cycle
    const result = this.pendingResult;
    this.pendingResult = null;
    if (!result) return null;

    // Upgrade uncertain → pass/fail based on target match
    const bestLabel = (this as { _bestLabel?: string })._bestLabel;
    const bestProb = (this as { _bestProb?: number })._bestProb ?? 0;

    if (!bestLabel || bestProb < FAIL_THRESHOLD) {
      this.passHoldCount = 0;
      const out: RecognitionResult = { kind: "uncertain", confidence: bestProb };
      this.lastEmittedKind = out.kind;
      return out;
    }

    if (bestLabel === target.glyph && bestProb >= PASS_THRESHOLD) {
      this.passHoldCount++;
      if (this.passHoldCount >= PASS_HOLD_FRAMES && this.lastEmittedKind !== "pass") {
        this.lastEmittedKind = "pass";
        return { kind: "pass", confidence: bestProb };
      }
      // Still holding — don't emit yet
      return null;
    }

    // Recognized something else confidently enough
    this.passHoldCount = 0;
    if (this.lastEmittedKind !== "fail") {
      this.lastEmittedKind = "fail";
      return { kind: "fail", confidence: bestProb };
    }
    return null;
  }

  /**
   * Debug snapshot for the diagnostic HUD. Returns the latest smoothed
   * probability distribution along with model status. Safe to call on
   * every render; reads in-memory state with no allocations beyond the
   * returned arrays.
   */
  getDebugInfo(): {
    status: "loading" | "ready" | "error";
    labels: string[];
    probs: number[];
    framesBuffered: number;
    passHoldCount: number;
    passHoldFramesNeeded: number;
    thresholds: { pass: number; fail: number };
  } | null {
    if (this.loadError) {
      return {
        status: "error",
        labels: this.labelMap?.labels ?? [],
        probs: [],
        framesBuffered: 0,
        passHoldCount: 0,
        passHoldFramesNeeded: PASS_HOLD_FRAMES,
        thresholds: { pass: PASS_THRESHOLD, fail: FAIL_THRESHOLD },
      };
    }
    if (!this.session || !this.labelMap) {
      return {
        status: "loading",
        labels: [],
        probs: [],
        framesBuffered: 0,
        passHoldCount: 0,
        passHoldFramesNeeded: PASS_HOLD_FRAMES,
        thresholds: { pass: PASS_THRESHOLD, fail: FAIL_THRESHOLD },
      };
    }

    const n = this.probBuffer.length;
    const len = this.labelMap.labels.length;
    const smoothed = new Array<number>(len).fill(0);
    if (n > 0) {
      for (const p of this.probBuffer) {
        for (let i = 0; i < len; i++) smoothed[i] += p[i] / n;
      }
    }

    return {
      status: "ready",
      labels: this.labelMap.labels,
      probs: smoothed,
      framesBuffered: n,
      passHoldCount: this.passHoldCount,
      passHoldFramesNeeded: PASS_HOLD_FRAMES,
      thresholds: { pass: PASS_THRESHOLD, fail: FAIL_THRESHOLD },
    };
  }

  reset(): void {
    this.passHoldCount = 0;
    this.probBuffer.length = 0;
    this.lastEmittedKind = null;
    this.pendingResult = null;
    delete (this as { _bestLabel?: string })._bestLabel;
    delete (this as { _bestProb?: number })._bestProb;
  }

  dispose(): void {
    void this.session?.release().catch(() => {});
    this.session = null;
    this.reset();
  }
}
