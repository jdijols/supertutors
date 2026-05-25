import { describe, it, expect, beforeEach } from 'vitest';
import { pinchStrength, detectPinch, PinchRecognizer } from './gestures';
import type { Landmark } from './gestures';

// Build a minimal 21-landmark hand. All landmarks at origin by default.
function makeLandmarks(overrides: Partial<Record<number, Partial<Landmark>>> = {}): Landmark[] {
  const base = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  for (const [idx, vals] of Object.entries(overrides)) {
    Object.assign(base[Number(idx)], vals);
  }
  return base;
}

// Wrist=0, MiddleBase=9 define palm width. ThumbTip=4, IndexTip=8.
function handWithPalmWidth(palmWidth: number, pinchDist: number): Landmark[] {
  return makeLandmarks({
    0: { x: 0, y: 0 },        // WRIST
    9: { x: palmWidth, y: 0 }, // MIDDLE_BASE (palm width reference)
    4: { x: 0, y: 0 },        // THUMB_TIP
    8: { x: pinchDist, y: 0 }, // INDEX_TIP (distance from thumb)
  });
}

describe('pinchStrength', () => {
  it('returns 0 for fully open hand (pinch dist equals palm width)', () => {
    const lms = handWithPalmWidth(0.3, 0.3); // pinch dist == palm width
    expect(pinchStrength(lms)).toBeCloseTo(0);
  });

  it('returns 1 for fully closed pinch (zero distance)', () => {
    const lms = handWithPalmWidth(0.3, 0);
    expect(pinchStrength(lms)).toBeCloseTo(1);
  });

  it('returns ~0.5 when pinch dist is half the palm width', () => {
    const lms = handWithPalmWidth(0.3, 0.15);
    expect(pinchStrength(lms)).toBeCloseTo(0.5, 1);
  });

  it('is invariant to palm scale (same ratio → same strength)', () => {
    const small = handWithPalmWidth(0.1, 0.05); // 50% pinch
    const large = handWithPalmWidth(0.5, 0.25); // 50% pinch
    expect(pinchStrength(small)).toBeCloseTo(pinchStrength(large), 5);
  });

  it('returns 0 when landmarks are missing', () => {
    expect(pinchStrength([])).toBe(0);
  });
});

describe('detectPinch (stateless)', () => {
  it('is not pinching when hand is open', () => {
    const lms = handWithPalmWidth(0.3, 0.3); // strength ≈ 0
    const result = detectPinch(lms, false);
    expect(result.isPinching).toBe(false);
  });

  it('is pinching when fingers are touching (strength > 0.7 threshold)', () => {
    // pinch dist ≈ 0.03 on palm width 0.3 → strength ≈ 0.9
    const lms = handWithPalmWidth(0.3, 0.03);
    const result = detectPinch(lms, false);
    expect(result.isPinching).toBe(true);
    expect(result.strength).toBeGreaterThan(0.7);
  });

  it('pinch center is midpoint of thumb tip and index tip', () => {
    const lms = makeLandmarks({
      0: { x: 0, y: 0 },
      9: { x: 0.3, y: 0 },
      4: { x: 0.2, y: 0.1 }, // thumb tip
      8: { x: 0.4, y: 0.3 }, // index tip
    });
    const result = detectPinch(lms, false);
    expect(result.pinchCenter.x).toBeCloseTo(0.3);
    expect(result.pinchCenter.y).toBeCloseTo(0.2);
  });
});

describe('PinchRecognizer (stateful hysteresis)', () => {
  let rec: PinchRecognizer;

  beforeEach(() => {
    rec = new PinchRecognizer();
  });

  it('does not enter pinch below 0.7 strength threshold', () => {
    // strength ≈ 0.5 (not enough to enter)
    const lms = handWithPalmWidth(0.3, 0.15);
    const state = rec.update(lms);
    expect(state.isPinching).toBe(false);
  });

  it('enters pinch when strength crosses 0.7', () => {
    const lms = handWithPalmWidth(0.3, 0.03); // strength ≈ 0.9
    const state = rec.update(lms);
    expect(state.isPinching).toBe(true);
  });

  it('hysteresis: stays pinching until strength drops below 0.4', () => {
    // Enter pinch
    rec.update(handWithPalmWidth(0.3, 0.03)); // strong pinch

    // Mid-zone (0.4–0.7): should STAY pinching (hysteresis holds)
    const midLms = handWithPalmWidth(0.3, 0.15); // strength ≈ 0.5
    const midState = rec.update(midLms);
    expect(midState.isPinching).toBe(true);

    // Below 0.4 → should EXIT pinch
    const openLms = handWithPalmWidth(0.3, 0.27); // strength ≈ 0.1
    const openState = rec.update(openLms);
    expect(openState.isPinching).toBe(false);
  });

  it('does not re-enter pinch from mid-zone (enter threshold is 0.7)', () => {
    // Start at mid-zone (never entered pinch yet)
    const midLms = handWithPalmWidth(0.3, 0.15); // strength ≈ 0.5
    const state = rec.update(midLms);
    expect(state.isPinching).toBe(false);
  });

  it('reset clears pinch state', () => {
    rec.update(handWithPalmWidth(0.3, 0.03)); // enter pinch
    rec.reset();
    // After reset, mid-zone shouldn't count as pinching
    const midLms = handWithPalmWidth(0.3, 0.15);
    const state = rec.update(midLms);
    expect(state.isPinching).toBe(false);
  });
});
