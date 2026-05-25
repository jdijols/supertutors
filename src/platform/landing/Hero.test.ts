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
});
