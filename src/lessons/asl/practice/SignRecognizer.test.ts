import { describe, it, expect, beforeEach, vi } from "vitest";
import { MockSignRecognizer } from "./SignRecognizer";
import type { Sign } from "../vocab";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

const helloSign: Sign = {
  id: "asl:HELLO",
  glyph: "HELLO",
  trained: true,
  phonology: {
    handshape: "B",
    location: "Forehead",
    movement: "Away",
    palmOrientation: "In",
  },
};

const fakeLandmarks: NormalizedLandmark[][] = [
  // One hand, 21 dummy landmarks
  Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 })),
];

describe("MockSignRecognizer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns no_hand on first call when no landmarks", () => {
    const rec = new MockSignRecognizer({ disableKeyboard: true });
    const result = rec.observe(helloSign, null);
    expect(result).toEqual({ kind: "no_hand" });
    rec.dispose();
  });

  it("returns null on subsequent calls without hand (no spam)", () => {
    const rec = new MockSignRecognizer({ disableKeyboard: true });
    rec.observe(helloSign, null); // first → no_hand
    const second = rec.observe(helloSign, null);
    expect(second).toBeNull();
    rec.dispose();
  });

  it("returns null when hand first appears (starts timer)", () => {
    const rec = new MockSignRecognizer({ disableKeyboard: true });
    const result = rec.observe(helloSign, fakeLandmarks);
    expect(result).toBeNull();
    rec.dispose();
  });

  it("returns pass after passDurationMs of sustained hand", () => {
    const rec = new MockSignRecognizer({
      disableKeyboard: true,
      passDurationMs: 1000,
    });
    rec.observe(helloSign, fakeLandmarks); // start timer

    // Advance time past the threshold
    vi.advanceTimersByTime(1100);

    const result = rec.observe(helloSign, fakeLandmarks);
    expect(result?.kind).toBe("pass");
    if (result?.kind === "pass") {
      expect(result.confidence).toBeGreaterThan(0.9);
    }
    rec.dispose();
  });

  it("does not double-fire pass", () => {
    const rec = new MockSignRecognizer({
      disableKeyboard: true,
      passDurationMs: 1000,
    });
    rec.observe(helloSign, fakeLandmarks);
    vi.advanceTimersByTime(1100);
    rec.observe(helloSign, fakeLandmarks); // pass

    const second = rec.observe(helloSign, fakeLandmarks);
    expect(second).toBeNull();
    rec.dispose();
  });

  it("reset clears the timer", () => {
    const rec = new MockSignRecognizer({
      disableKeyboard: true,
      passDurationMs: 1000,
    });
    rec.observe(helloSign, fakeLandmarks);
    vi.advanceTimersByTime(500);

    rec.reset();

    vi.advanceTimersByTime(500); // total 1000, but reset means timer restarted
    const result = rec.observe(helloSign, fakeLandmarks);
    // The reset means observe restarts the timer — first call after reset returns null
    expect(result).toBeNull();
    rec.dispose();
  });

  it("losing the hand resets the timer", () => {
    const rec = new MockSignRecognizer({
      disableKeyboard: true,
      passDurationMs: 1000,
    });
    rec.observe(helloSign, fakeLandmarks); // start
    vi.advanceTimersByTime(800);

    rec.observe(helloSign, null); // hand lost → no_hand

    vi.advanceTimersByTime(300);
    const result = rec.observe(helloSign, fakeLandmarks);
    // Should restart timer, not be ready yet (only 300ms in)
    expect(result).toBeNull();
    rec.dispose();
  });

  it("getProgress returns 0 with no hand", () => {
    const rec = new MockSignRecognizer({ disableKeyboard: true });
    expect(rec.getProgress()).toBe(0);
    rec.dispose();
  });

  it("getProgress increases over time with hand visible", () => {
    const rec = new MockSignRecognizer({
      disableKeyboard: true,
      passDurationMs: 1000,
    });
    rec.observe(helloSign, fakeLandmarks);
    vi.advanceTimersByTime(500);
    expect(rec.getProgress()).toBeGreaterThan(0.4);
    expect(rec.getProgress()).toBeLessThan(0.6);
    rec.dispose();
  });
});
