import { describe, it, expect } from "vitest";
import { ALL_SIGNS, TRAINED_SIGNS, getTrainedSigns, getSignById } from "./vocab";

describe("ASL vocab catalog", () => {
  it("has 34 trained signs (26 letters + 8 words)", () => {
    expect(TRAINED_SIGNS.length).toBe(34);
    expect(getTrainedSigns().length).toBe(34);
  });

  it("first 26 trained signs are letters A–Z in order", () => {
    const letters = TRAINED_SIGNS.slice(0, 26);
    expect(letters.map((s) => s.glyph)).toEqual("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
    for (const sign of letters) {
      expect(sign.glyph).toMatch(/^[A-Z]$/);
      expect(sign.id).toBe(`asl:${sign.glyph}`);
    }
  });

  it("trailing 8 trained signs are the legacy word signs", () => {
    const words = TRAINED_SIGNS.slice(26);
    expect(words.map((s) => s.glyph)).toEqual([
      "HELLO", "THANK YOU", "YES", "NO", "PLEASE", "SORRY", "HELP", "FRIEND",
    ]);
  });

  it("all trained signs have non-empty phonology", () => {
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

  it("word signs have reference videos, letter signs do not", () => {
    for (const sign of TRAINED_SIGNS.slice(0, 26)) {
      expect(sign.referenceVideo).toBeUndefined();
    }
    for (const sign of TRAINED_SIGNS.slice(26)) {
      expect(sign.referenceVideo).toBeTruthy();
      expect(sign.referenceVideo).toMatch(/^\/lessons\/asl\/videos\/.+\.webm$/);
    }
  });

  it("ALL_SIGNS combines trained + catalog (~110 total)", () => {
    expect(ALL_SIGNS.length).toBeGreaterThanOrEqual(100);
    expect(ALL_SIGNS.length).toBeLessThanOrEqual(120);
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

  it("getSignById returns correct letter", () => {
    const a = getSignById("asl:A");
    expect(a).toBeDefined();
    expect(a!.glyph).toBe("A");
    expect(a!.trained).toBe(true);
  });

  it("getSignById returns correct word sign", () => {
    const hello = getSignById("asl:HELLO");
    expect(hello).toBeDefined();
    expect(hello!.glyph).toBe("HELLO");
    expect(hello!.trained).toBe(true);
    expect(hello!.referenceVideo).toBeTruthy();
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
