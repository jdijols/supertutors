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
