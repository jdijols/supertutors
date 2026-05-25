import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "AboutCard.tsx"), "utf-8");

describe("AboutCard — DESIGN.md compliance", () => {
  it("exports AboutCard", () => {
    expect(src).toMatch(/export.*AboutCard/);
  });

  it("has ABOUT eyebrow text", () => {
    expect(src).toMatch(/ABOUT/i);
  });

  it("has the colophon headline", () => {
    expect(src).toMatch(/Tutors for the AI generation/i);
  });

  it("uses font-mono for labels (DESIGN.md §Typography)", () => {
    expect(src).toMatch(/\bfont-mono\b/);
  });

  it("uses focus-visible:ring-sb-accent (DESIGN.md §Accessibility)", () => {
    expect(src).toMatch(/focus-visible:ring-sb-accent/);
  });

  it("does not use deprecated font-display (DESIGN.md §Typography)", () => {
    expect(src).not.toMatch(/\bfont-display\b/);
  });

  it("has SuperBuilders footer attribution", () => {
    expect(src).toMatch(/SuperBuilders/i);
  });
});
