import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PracticeScreen", () => {
  it("uses basil-400 for hand-detected indicator, not generic green-* (DESIGN.md §Color)", () => {
    const src = readFileSync(resolve(__dirname, "PracticeScreen.tsx"), "utf-8");
    expect(src).not.toMatch(/\bgreen-400\b/);
    expect(src).not.toMatch(/\bgreen-500\b/);
  });
});
