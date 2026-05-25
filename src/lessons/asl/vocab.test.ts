import { describe, it, expect } from "vitest";
import { ALL_SIGNS, TRAINED_SIGNS, getTrainedSigns, getSignById } from "./vocab";

describe("ASL vocab catalog", () => {
  it("has 26 trained letters (A–Z)", () => {
    expect(TRAINED_SIGNS.length).toBe(26);
    expect(getTrainedSigns().length).toBe(26);
  });

  it("trained signs are A–Z in alphabetical order, single uppercase letters", () => {
    const expected = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    expect(TRAINED_SIGNS.map((s) => s.glyph)).toEqual(expected);
    for (const sign of TRAINED_SIGNS) {
      expect(sign.glyph).toMatch(/^[A-Z]$/);
    }
  });

  it("trained letter IDs follow asl:<LETTER> format", () => {
    for (const sign of TRAINED_SIGNS) {
      expect(sign.id).toBe(`asl:${sign.glyph}`);
    }
  });

  it("all trained signs have non-empty handshape phonology", () => {
    for (const sign of TRAINED_SIGNS) {
      expect(sign.trained).toBe(true);
      expect(sign.phonology).toBeDefined();
      expect(sign.phonology!.handshape).toBeTruthy();
      expect(sign.phonology!.location).toBeTruthy();
      expect(sign.phonology!.movement).toBeTruthy();
      expect(sign.phonology!.palmOrientation).toBeTruthy();
    }
  });

  it("J and Z have non-static movement descriptions", () => {
    const j = TRAINED_SIGNS.find((s) => s.glyph === "J")!;
    const z = TRAINED_SIGNS.find((s) => s.glyph === "Z")!;
    expect(j.phonology!.movement.toLowerCase()).not.toBe("static");
    expect(z.phonology!.movement.toLowerCase()).not.toBe("static");
  });

  it("the 8 former word signs are now catalog (untrained)", () => {
    for (const glyph of ["HELLO", "THANK YOU", "YES", "NO", "PLEASE", "SORRY", "HELP", "FRIEND"]) {
      const sign = ALL_SIGNS.find((s) => s.glyph === glyph);
      expect(sign, `expected ${glyph} in catalog`).toBeDefined();
      expect(sign!.trained).toBe(false);
    }
  });

  it("ALL_SIGNS contains the 26 letters + word catalog (~110 total)", () => {
    expect(ALL_SIGNS.length).toBeGreaterThanOrEqual(100);
    expect(ALL_SIGNS.length).toBeLessThanOrEqual(115);
  });

  it("no duplicate IDs across catalog", () => {
    const ids = ALL_SIGNS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all IDs follow the asl: prefix convention", () => {
    for (const sign of ALL_SIGNS) {
      expect(sign.id).toMatch(/^asl:/);
    }
  });

  it("getSignById returns correct letter", () => {
    const a = getSignById("asl:A");
    expect(a).toBeDefined();
    expect(a!.glyph).toBe("A");
    expect(a!.trained).toBe(true);
  });

  it("getSignById returns undefined for unknown ID", () => {
    expect(getSignById("asl:NONEXISTENT")).toBeUndefined();
  });

  it("untrained catalog signs have no phonology or video", () => {
    const untrained = ALL_SIGNS.filter((s) => !s.trained);
    expect(untrained.length).toBeGreaterThan(0);
    for (const sign of untrained) {
      expect(sign.phonology).toBeUndefined();
      expect(sign.referenceVideo).toBeUndefined();
    }
  });
});
