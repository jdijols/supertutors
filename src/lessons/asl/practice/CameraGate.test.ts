import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("CameraGate", () => {
  it("button has focus-visible:ring-offset-2 (DESIGN.md §Accessibility)", () => {
    const src = readFileSync(resolve(__dirname, "CameraGate.tsx"), "utf-8");
    const ringBlocks = src.match(/focus-visible:ring-2[^"']*/g) ?? [];
    for (const block of ringBlocks) {
      expect(block).toMatch("focus-visible:ring-offset-2");
    }
  });
});
