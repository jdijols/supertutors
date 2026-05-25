/**
 * OnnxSeqSignRecognizer — sequence-based ASL sign recognition.
 *
 * Backed by a small 1D-CNN + Transformer model ported from hoyso48's
 * Kaggle ASL Signs 1st-place solution (shrunk to dim=64 for browser).
 *
 * Model I/O contract (from export_onnx_seq.py):
 *   Input:  float_input  [1, 32, 126]  float32
 *           32 frames × (63 position + 63 velocity)
 *   Output: probabilities [1, 9]  float32   — 8 signs + BACKGROUND
 *
 * Browser maintains a rolling 32-frame ring buffer of features.
 * Inference fires every frame and reads the full 32-frame window.
 * Once the buffer is full (~1 second after the hand first appears),
 * the model has enough temporal context to recognize motion signs.
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Sign } from "../vocab";
import type { RecognitionResult, SignRecognizer } from "./SignRecognizer";

const MODEL_URL = "/lessons/asl/model/asl_classifier.onnx";
const LABEL_MAP_URL = "/lessons/asl/model/label_map.json";

const SEQ_LEN = 32;
const POSITION_DIM = 63;
const FEATURE_DIM = 126;

const PASS_THRESHOLD = 0.65;
const PASS_THRESHOLD_FLOOR = 0.50;     // adaptive floor when the user is stuck
const ADAPTIVE_RAMP_START_FRAMES = 450; // ~15s @ 30fps before easing begins
const ADAPTIVE_RAMP_LENGTH_FRAMES = 150; // ~5s ramp from 0.65 → 0.50
const FAIL_THRESHOLD = 0.45;
const SMOOTH_FRAMES = 5;
const PASS_HOLD_FRAMES = 6;

/**
 * Adaptive threshold: starts at PASS_THRESHOLD, holds there until
 * ADAPTIVE_RAMP_START_FRAMES, then linearly drops to PASS_THRESHOLD_FLOOR
 * over ADAPTIVE_RAMP_LENGTH_FRAMES frames. Hidden from the user — gives
 * the lesson a "feels easier the longer you try" character without
 * exposing the mechanic.
 */
function adaptivePassThreshold(framesOnCurrentSign: number): number {
  if (framesOnCurrentSign < ADAPTIVE_RAMP_START_FRAMES) return PASS_THRESHOLD;
  const t = Math.min(
    1,
    (framesOnCurrentSign - ADAPTIVE_RAMP_START_FRAMES) / ADAPTIVE_RAMP_LENGTH_FRAMES,
  );
  return PASS_THRESHOLD + (PASS_THRESHOLD_FLOOR - PASS_THRESHOLD) * t;
}

interface LabelMap {
  labels: string[];
  background_idx: number;
  feature_dim: number;
  seq_len?: number;
}

function landmarksToFlat(landmarks: NormalizedLandmark[]): Float32Array {
  const flat = new Float32Array(POSITION_DIM);
  for (let i = 0; i < 21; i++) {
    flat[i * 3 + 0] = landmarks[i].x;
    flat[i * 3 + 1] = landmarks[i].y;
    flat[i * 3 + 2] = landmarks[i].z;
  }
  return flat;
}

function buildFrameFeatures(
  position: Float32Array,
  previousPosition: Float32Array | null
): Float32Array {
  const features = new Float32Array(FEATURE_DIM);
  features.set(position, 0);
  if (previousPosition) {
    for (let i = 0; i < POSITION_DIM; i++) {
      features[POSITION_DIM + i] = position[i] - previousPosition[i];
    }
  }
  return features;
}

export class OnnxSeqSignRecognizer implements SignRecognizer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private session: any | null = null;
  private labelMap: LabelMap | null = null;
  private loadError: string | null = null;

  private readonly buffer: Float32Array[] = [];
  private previousPosition: Float32Array | null = null;
  private readonly probBuffer: Float32Array[] = [];
  private framesSinceHand = 0;

  /** Counter for the adaptive threshold ramp. Reset() clears it. */
  private framesOnCurrentSign = 0;

  private passHoldCount = 0;
  private lastEmittedKind: RecognitionResult["kind"] | null = null;

  private bestLabel: string | null = null;
  private bestProb = 0;

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const ort = await import("onnxruntime-web");
      ort.env.wasm.wasmPaths =
        "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/";
      this.session = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ["wasm"],
      });
      const resp = await fetch(LABEL_MAP_URL);
      this.labelMap = (await resp.json()) as LabelMap;
    } catch (err) {
      this.loadError = String(err);
      console.error("[OnnxSeqSignRecognizer] Failed to load model:", err);
    }
  }

  /**
   * Pack the ring buffer into one contiguous (SEQ_LEN × FEATURE_DIM) array.
   * Most-recent frame is at the END. If we have fewer than SEQ_LEN frames,
   * pad the FRONT with repetitions of the oldest available frame so the
   * model sees a "stationary then moving" sequence rather than zeros that
   * collide with the synthetic-background distribution.
   */
  private packBufferToTensor(): Float32Array {
    const out = new Float32Array(SEQ_LEN * FEATURE_DIM);
    const have = this.buffer.length;
    if (have === 0) return out;

    if (have < SEQ_LEN) {
      const padCount = SEQ_LEN - have;
      for (let i = 0; i < padCount; i++) {
        out.set(this.buffer[0], i * FEATURE_DIM);
      }
      for (let i = 0; i < have; i++) {
        out.set(this.buffer[i], (padCount + i) * FEATURE_DIM);
      }
    } else {
      for (let i = 0; i < SEQ_LEN; i++) {
        out.set(this.buffer[i], i * FEATURE_DIM);
      }
    }
    return out;
  }

  private async runInference(): Promise<void> {
    if (!this.session || !this.labelMap) return;

    try {
      const ort = await import("onnxruntime-web");
      const flat = this.packBufferToTensor();
      const tensor = new ort.Tensor("float32", flat, [1, SEQ_LEN, FEATURE_DIM]);
      const outputs = await this.session.run({ float_input: tensor });

      const probs = (
        outputs.probabilities ?? outputs[Object.keys(outputs)[0]]
      ).data as Float32Array;

      this.probBuffer.push(Float32Array.from(probs));
      if (this.probBuffer.length > SMOOTH_FRAMES) this.probBuffer.shift();

      const n = this.probBuffer.length;
      const smoothed = new Float32Array(probs.length);
      for (const p of this.probBuffer) {
        for (let i = 0; i < p.length; i++) smoothed[i] += p[i] / n;
      }

      const bgIdx = this.labelMap.background_idx;
      let bestIdx = -1;
      let bestProb = 0;
      for (let i = 0; i < smoothed.length; i++) {
        if (i === bgIdx) continue;
        if (smoothed[i] > bestProb) {
          bestProb = smoothed[i];
          bestIdx = i;
        }
      }

      this.bestLabel = bestIdx >= 0 ? this.labelMap.labels[bestIdx] : null;
      this.bestProb = bestProb;
    } catch (err) {
      console.warn("[OnnxSeqSignRecognizer] inference error:", err);
    }
  }

  observe(
    target: Sign,
    landmarks: NormalizedLandmark[][] | null
  ): RecognitionResult | null {
    if (this.loadError) return { kind: "uncertain", confidence: 0 };

    if (!landmarks || landmarks.length === 0) {
      this.passHoldCount = 0;
      this.buffer.length = 0;
      this.probBuffer.length = 0;
      this.previousPosition = null;
      this.framesSinceHand = 0;
      this.bestLabel = null;
      this.bestProb = 0;
      if (this.lastEmittedKind !== "no_hand") {
        this.lastEmittedKind = "no_hand";
        return { kind: "no_hand" };
      }
      return null;
    }

    const position = landmarksToFlat(landmarks[0]);
    const features = buildFrameFeatures(position, this.previousPosition);
    this.previousPosition = position;
    this.framesSinceHand++;
    this.framesOnCurrentSign++;

    this.buffer.push(features);
    if (this.buffer.length > SEQ_LEN) this.buffer.shift();

    void this.runInference();

    // Wait until we have enough temporal context — ~333ms
    if (this.framesSinceHand < 10) return null;

    const bestLabel = this.bestLabel;
    const bestProb = this.bestProb;
    const passThreshold = adaptivePassThreshold(this.framesOnCurrentSign);

    if (!bestLabel || bestProb < FAIL_THRESHOLD) {
      this.passHoldCount = 0;
      if (this.lastEmittedKind !== "uncertain") {
        this.lastEmittedKind = "uncertain";
        return { kind: "uncertain", confidence: bestProb };
      }
      return null;
    }

    if (bestLabel === target.glyph && bestProb >= passThreshold) {
      this.passHoldCount++;
      if (this.passHoldCount >= PASS_HOLD_FRAMES && this.lastEmittedKind !== "pass") {
        this.lastEmittedKind = "pass";
        return { kind: "pass", confidence: bestProb };
      }
      return null;
    }

    this.passHoldCount = 0;
    if (this.lastEmittedKind !== "fail") {
      this.lastEmittedKind = "fail";
      return { kind: "fail", confidence: bestProb };
    }
    return null;
  }

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
      framesBuffered: this.buffer.length,
      passHoldCount: this.passHoldCount,
      passHoldFramesNeeded: PASS_HOLD_FRAMES,
      thresholds: { pass: PASS_THRESHOLD, fail: FAIL_THRESHOLD },
    };
  }

  reset(): void {
    this.passHoldCount = 0;
    this.buffer.length = 0;
    this.probBuffer.length = 0;
    this.previousPosition = null;
    this.framesSinceHand = 0;
    this.framesOnCurrentSign = 0;
    this.bestLabel = null;
    this.bestProb = 0;
    this.lastEmittedKind = null;
  }

  dispose(): void {
    void this.session?.release().catch(() => {});
    this.session = null;
    this.reset();
  }
}
