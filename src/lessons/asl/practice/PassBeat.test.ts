import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PassBeat", () => {
  it("uses basil-400 palette token for success green, not green-500 (DESIGN.md §Color)", () => {
    const src = readFileSync(resolve(__dirname, "PassBeat.tsx"), "utf-8");
    expect(src).not.toMatch(/\bgreen-500\b/);
    expect(src).not.toMatch(/\bgreen-400\b/);
  });
});
