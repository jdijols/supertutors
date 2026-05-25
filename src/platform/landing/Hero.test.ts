import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Hero", () => {
  it("all buttons have focus-visible:ring-offset-2 (DESIGN.md §Accessibility)", () => {
    const src = readFileSync(resolve(__dirname, "Hero.tsx"), "utf-8");
    // Count className blocks that have focus-visible:ring-2 — each must also
    // have ring-offset-2 on the same element.
    const ringBlocks = src.match(/focus-visible:ring-2[^"']*/g) ?? [];
    for (const block of ringBlocks) {
      expect(block).toMatch("focus-visible:ring-offset-2");
    }
  });

  it("loading skeleton reserves enough height to prevent CLS on auth resolution (DESIGN.md §Layout)", () => {
    const src = readFileSync(resolve(__dirname, "Hero.tsx"), "utf-8");
    // h-24 (96px) is too short for the signed-out hero (~170px mobile),
    // causing visible layout shift when auth resolves. Minimum is min-h-40 (160px).
    expect(src).not.toMatch(/\bh-24\b/);
  });
});
