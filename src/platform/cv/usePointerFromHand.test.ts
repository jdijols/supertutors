import { describe, it, expect } from 'vitest';
import { handCoordsToViewport } from './usePointerFromHand';

describe('handCoordsToViewport', () => {
  const W = 1280;
  const H = 800;

  it('maps top-left webcam (0,0) to top-right of viewport (mirrored X)', () => {
    const { x, y } = handCoordsToViewport(0, 0, W, H);
    expect(x).toBe(W);   // mirrored: normalized 0 → right edge
    expect(y).toBe(0);
  });

  it('maps top-right webcam (1,0) to top-left of viewport (mirrored X)', () => {
    const { x, y } = handCoordsToViewport(1, 0, W, H);
    expect(x).toBe(0);   // mirrored: normalized 1 → left edge
    expect(y).toBe(0);
  });

  it('maps center (0.5, 0.5) to center of viewport', () => {
    const { x, y } = handCoordsToViewport(0.5, 0.5, W, H);
    expect(x).toBeCloseTo(W / 2);
    expect(y).toBeCloseTo(H / 2);
  });

  it('maps bottom-right webcam (1,1) to bottom-left of viewport', () => {
    const { x, y } = handCoordsToViewport(1, 1, W, H);
    expect(x).toBe(0);
    expect(y).toBe(H);
  });

  it('clamps and scales correctly with non-square viewport', () => {
    const { x, y } = handCoordsToViewport(0.25, 0.75, 400, 300);
    expect(x).toBeCloseTo(300);  // (1 - 0.25) * 400
    expect(y).toBeCloseTo(225);  // 0.75 * 300
  });

  it('works with non-standard viewport dimensions', () => {
    const { x, y } = handCoordsToViewport(0.3, 0.8, 100, 50);
    expect(x).toBeCloseTo(70);  // (1-0.3)*100
    expect(y).toBeCloseTo(40);  // 0.8*50
  });
});
