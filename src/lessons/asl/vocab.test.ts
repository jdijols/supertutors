import { describe, it, expect } from "vitest";
import { ALL_SIGNS, TRAINED_SIGNS, getTrainedSigns, getSignById } from "./vocab";

describe("ASL vocab catalog", () => {
  it("exports 75–100 total signs", () => {
    expect(ALL_SIGNS.length).toBeGreaterThanOrEqual(75);
    expect(ALL_SIGNS.length).toBeLessThanOrEqual(100);
  });

  it("has 8 trained hero signs", () => {
    expect(TRAINED_SIGNS.length).toBe(8);
    expect(getTrainedSigns().length).toBe(8);
  });

  it("all trained signs have complete phonology", () => {
    for (const sign of TRAINED_SIGNS) {
      expect(sign.trained).toBe(true);
      expect(sign.phonology).toBeDefined();
      expect(sign.phonology!.handshape).toBeTruthy();
      expect(sign.phonology!.location).toBeTruthy();
      expect(sign.phonology!.movement).toBeTruthy();
      expect(sign.phonology!.palmOrientation).toBeTruthy();
    }
  });

  it("all trained signs have a reference video path", () => {
    for (const sign of TRAINED_SIGNS) {
      expect(sign.referenceVideo).toBeTruthy();
      expect(sign.referenceVideo).toMatch(/^\/lessons\/asl\/videos\/.+\.webm$/);
    }
  });

  it("no duplicate IDs", () => {
    const ids = ALL_SIGNS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all IDs follow the asl: prefix convention", () => {
    for (const sign of ALL_SIGNS) {
      expect(sign.id).toMatch(/^asl:/);
    }
  });

  it("getSignById returns correct sign", () => {
    const hello = getSignById("asl:HELLO");
    expect(hello).toBeDefined();
    expect(hello!.glyph).toBe("HELLO");
    expect(hello!.trained).toBe(true);
  });

  it("getSignById returns undefined for unknown ID", () => {
    expect(getSignById("asl:NONEXISTENT")).toBeUndefined();
  });

  it("untrained signs have no phonology or video", () => {
    const untrained = ALL_SIGNS.filter((s) => !s.trained);
    expect(untrained.length).toBeGreaterThan(0);
    for (const sign of untrained) {
      expect(sign.phonology).toBeUndefined();
      expect(sign.referenceVideo).toBeUndefined();
    }
  });
});
