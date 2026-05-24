import { describe, expect, it } from "vitest";
import { getLine, lineHasNameSlot, renderLine } from "./dialogue";

// As of the 2026-05-21 explore-act rework, `onboarding_response` is the
// ONLY line in dialogue.json that still carries a {{NAME}} slot — Freddy
// calls everyone "kid" everywhere else to keep the rhythm and avoid
// runtime name-stitch breaks. Tests here assert that singular slot still
// works end-to-end and that the rest are correctly detected as static.

describe("getLine", () => {
  it("returns the raw authored line including any placeholder", () => {
    expect(getLine("onboarding_response")).toContain("{{NAME}}");
  });

  it("returns onboarding lines we added for the lesson flow", () => {
    expect(getLine("onboarding_greeting")).toMatch(/welcome to SuperSlice/i);
    expect(getLine("onboarding_response")).toContain("{{NAME}}");
  });
});

describe("lineHasNameSlot", () => {
  it("detects {{NAME}}-bearing lines", () => {
    // The single recognition beat right after the kid types their name.
    expect(lineHasNameSlot("onboarding_response")).toBe(true);
  });

  it("returns false for static lines (Freddy calls them 'kid')", () => {
    expect(lineHasNameSlot("aha_setup")).toBe(false);
    expect(lineHasNameSlot("aha_reveal")).toBe(false);
    expect(lineHasNameSlot("aha_wrong_slice")).toBe(false);
    expect(lineHasNameSlot("onboarding_greeting")).toBe(false);
    expect(lineHasNameSlot("explore_intro_1")).toBe(false);
    expect(lineHasNameSlot("explore_intro_2")).toBe(false);
  });
});

describe("renderLine", () => {
  it("returns static lines unchanged", () => {
    expect(renderLine("aha_wrong_slice")).toMatch(/^Hey, nice cut!/);
  });

  it("substitutes the name into {{NAME}} slots", () => {
    expect(renderLine("onboarding_response", { name: "Jason" })).toBe(
      "Jason, beautiful name. Alright, lemme show ya how this works.",
    );
  });

  it("throws if a placeholder line is rendered without a name", () => {
    expect(() => renderLine("onboarding_response")).toThrow(/needs a name/);
    expect(() => renderLine("onboarding_response", { name: "" })).toThrow(
      /needs a name/,
    );
  });
});
