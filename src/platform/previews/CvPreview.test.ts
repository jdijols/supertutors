import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("CvPreview", () => {
  it("uses min-h-[100dvh] not min-h-screen (DESIGN.md §Layout)", () => {
    const src = readFileSync(resolve(__dirname, "CvPreview.tsx"), "utf-8");
    expect(src).not.toMatch(/\bmin-h-screen\b/);
    expect(src).toMatch(/min-h-\[100dvh\]/);
  });

  it("error state uses terracotta palette, not generic red-* (DESIGN.md §Color)", () => {
    const src = readFileSync(resolve(__dirname, "CvPreview.tsx"), "utf-8");
    expect(src).not.toMatch(/\btext-red-\d+\b/);
  });
});
