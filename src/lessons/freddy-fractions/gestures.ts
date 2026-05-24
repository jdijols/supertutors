// Pure gesture logic — no React, no side effects. Easy to unit test.

export type Landmark = { x: number; y: number; z: number };

export type PinchState = {
  isPinching: boolean;
  /** Normalized viewport center of the pinch (0–1 range, pre-mirroring) */
  pinchCenter: { x: number; y: number };
  /** 0 (open) → 1 (fully pinched) */
  strength: number;
};

// Landmark indices in the MediaPipe 21-point hand model
const WRIST = 0;
const MIDDLE_BASE = 9; // used for palm width reference
const THUMB_TIP = 4;
const INDEX_TIP = 8;

/** Euclidean distance between two 2D landmark points (z ignored for pinch). */
function dist2d(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * detectPinch — stateless snapshot of pinch strength for one hand's landmarks.
 *
 * Normalized by palm width (wrist ↔ middle-finger-base) so the threshold is
 * hand-size-invariant and distance-from-camera-invariant.
 */
export function pinchStrength(landmarks: Landmark[]): number {
  const thumbTip = landmarks[THUMB_TIP];
  const indexTip = landmarks[INDEX_TIP];
  const wrist = landmarks[WRIST];
  const middleBase = landmarks[MIDDLE_BASE];

  if (!thumbTip || !indexTip || !wrist || !middleBase) return 0;

  const pinchDist = dist2d(thumbTip, indexTip);
  const palmWidth = dist2d(wrist, middleBase);

  if (palmWidth < 1e-6) return 0;

  // Strength approaches 1 as pinch distance approaches 0 relative to palm.
  // Clamp to [0, 1].
  return Math.max(0, Math.min(1, 1 - pinchDist / palmWidth));
}

const PINCH_ENTER = 0.7;
const PINCH_EXIT = 0.4;
const SMOOTH_ALPHA = 0.4;

/**
 * PinchRecognizer — stateful wrapper with hysteresis + exponential smoothing.
 * Create one instance per hand, call update() on each frame.
 */
export class PinchRecognizer {
  private _isPinching = false;
  private _smoothCenter = { x: 0.5, y: 0.5 };

  update(landmarks: Landmark[]): PinchState {
    const strength = pinchStrength(landmarks);

    // Hysteresis: only toggle state when crossing the appropriate threshold
    if (!this._isPinching && strength >= PINCH_ENTER) {
      this._isPinching = true;
    } else if (this._isPinching && strength < PINCH_EXIT) {
      this._isPinching = false;
    }

    // Pinch center = midpoint of thumb tip + index tip
    const thumbTip = landmarks[THUMB_TIP];
    const indexTip = landmarks[INDEX_TIP];
    if (thumbTip && indexTip) {
      const rawX = (thumbTip.x + indexTip.x) / 2;
      const rawY = (thumbTip.y + indexTip.y) / 2;
      // Exponential smoothing
      this._smoothCenter = {
        x: SMOOTH_ALPHA * rawX + (1 - SMOOTH_ALPHA) * this._smoothCenter.x,
        y: SMOOTH_ALPHA * rawY + (1 - SMOOTH_ALPHA) * this._smoothCenter.y,
      };
    }

    return {
      isPinching: this._isPinching,
      pinchCenter: { ...this._smoothCenter },
      strength,
    };
  }

  reset() {
    this._isPinching = false;
    this._smoothCenter = { x: 0.5, y: 0.5 };
  }
}

/**
 * detectPinch — convenience stateless function for the current snapshot.
 * Does NOT apply hysteresis or smoothing. Use PinchRecognizer for the full
 * pipeline when you need per-frame consistency.
 */
export function detectPinch(
  landmarks: Landmark[],
  currentlyPinching: boolean,
): PinchState {
  const strength = pinchStrength(landmarks);
  const threshold = currentlyPinching ? PINCH_EXIT : PINCH_ENTER;
  const isPinching = currentlyPinching
    ? strength >= PINCH_EXIT
    : strength >= PINCH_ENTER;

  void threshold; // used via logic above

  const thumbTip = landmarks[THUMB_TIP];
  const indexTip = landmarks[INDEX_TIP];
  const pinchCenter =
    thumbTip && indexTip
      ? { x: (thumbTip.x + indexTip.x) / 2, y: (thumbTip.y + indexTip.y) / 2 }
      : { x: 0.5, y: 0.5 };

  return { isPinching, pinchCenter, strength };
}
