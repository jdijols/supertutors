import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ConfidenceCue — DESIGN.md compliance", () => {
  it("uses sb-accent for progress bar color (DESIGN.md §Color)", () => {
    const src = readFileSync(resolve(__dirname, "ConfidenceCue.tsx"), "utf-8");
    expect(src).toMatch(/\bbg-sb-accent\b/);
    expect(src).not.toMatch(/\bgreen-[0-9]/);
  });

  it("has pointer-events-none so it doesn't steal interaction (DESIGN.md §Layout)", () => {
    const src = readFileSync(resolve(__dirname, "ConfidenceCue.tsx"), "utf-8");
    expect(src).toMatch(/pointer-events-none/);
  });
});
