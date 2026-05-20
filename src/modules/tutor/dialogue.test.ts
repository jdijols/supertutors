import { describe, expect, it } from "vitest";
import { getLine, lineHasNameSlot, renderLine } from "./dialogue";

describe("getLine", () => {
  it("returns the raw authored line including any placeholder", () => {
    expect(getLine("aha_reveal")).toContain("{{NAME}}");
  });

  it("returns onboarding lines we added for the lesson flow", () => {
    expect(getLine("onboarding_greeting")).toMatch(/welcome to SuperSlice/i);
    expect(getLine("onboarding_response")).toContain("{{NAME}}");
  });
});

describe("lineHasNameSlot", () => {
  it("detects {{NAME}}-bearing lines", () => {
    expect(lineHasNameSlot("aha_setup")).toBe(true);
    expect(lineHasNameSlot("onboarding_response")).toBe(true);
  });

  it("returns false for static lines", () => {
    expect(lineHasNameSlot("aha_wrong_slice")).toBe(false);
    expect(lineHasNameSlot("onboarding_greeting")).toBe(false);
  });
});

describe("renderLine", () => {
  it("returns static lines unchanged", () => {
    expect(renderLine("aha_wrong_slice")).toMatch(/^Hey, nice cut!/);
  });

  it("substitutes the name into {{NAME}} slots", () => {
    expect(renderLine("onboarding_response", { name: "Jason" })).toBe(
      "Jason! Beautiful name. Alright, lemme show ya how this works.",
    );
  });

  it("throws if a placeholder line is rendered without a name", () => {
    expect(() => renderLine("onboarding_response")).toThrow(/needs a name/);
    expect(() => renderLine("aha_reveal", { name: "" })).toThrow(
      /needs a name/,
    );
  });
});
