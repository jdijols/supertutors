import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("LandingPage — DESIGN.md compliance", () => {
  it("uses min-h-[100dvh] not min-h-screen (DESIGN.md §Layout)", () => {
    const src = readFileSync(resolve(__dirname, "LandingPage.tsx"), "utf-8");
    expect(src).not.toMatch(/\bmin-h-screen\b/);
    expect(src).toMatch(/min-h-\[100dvh\]/);
  });

  it("uses font-sans for body text (DESIGN.md §Typography)", () => {
    const src = readFileSync(resolve(__dirname, "LandingPage.tsx"), "utf-8");
    expect(src).toMatch(/\bfont-sans\b/);
    expect(src).not.toMatch(/\bfont-display\b/);
  });
});
