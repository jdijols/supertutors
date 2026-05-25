import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("SuperTutorsLockup — DESIGN.md compliance", () => {
  it("uses font-mono for wordmark (DESIGN.md §Typography)", () => {
    const src = readFileSync(resolve(__dirname, "SuperTutorsLockup.tsx"), "utf-8");
    expect(src).toMatch(/\bfont-mono\b/);
    expect(src).not.toMatch(/\bfont-display\b/);
  });

  it("LaurelMark has role=img with accessible label (WCAG §Non-text Content)", () => {
    const src = readFileSync(resolve(__dirname, "LaurelMark.tsx"), "utf-8");
    expect(src).toMatch(/role="img"/);
    expect(src).toMatch(/aria-label/);
  });

  it("LaurelMark image is aria-hidden (decorative within labeled container)", () => {
    const src = readFileSync(resolve(__dirname, "LaurelMark.tsx"), "utf-8");
    expect(src).toMatch(/alt=""/);
    expect(src).toMatch(/aria-hidden/);
  });
});

describe("SuperTutorsLockup — inline size variant", () => {
  const src = readFileSync(resolve(__dirname, "SuperTutorsLockup.tsx"), "utf-8");

  it("has inline size in SIZE_CLASSES", () => {
    expect(src).toMatch(/inline/);
  });

  it("inline size mark is w-14 h-14 sm:w-16 sm:h-16 (chrome button height)", () => {
    expect(src).toMatch(/w-14 h-14 sm:w-16 sm:h-16/);
  });

  it("inline size uses 28px/32px text scale (plan spec)", () => {
    expect(src).toMatch(/text-\[28px\]/);
    expect(src).toMatch(/text-\[32px\]/);
  });
});
