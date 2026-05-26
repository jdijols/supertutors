import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "AboutCard.tsx"), "utf-8");

describe("AboutCard — DESIGN.md compliance", () => {
  it("exports AboutCard", () => {
    expect(src).toMatch(/export.*AboutCard/);
  });

  it("accepts onActivate and className props", () => {
    expect(src).toMatch(/onActivate/);
    expect(src).toMatch(/className/);
  });

  it("renders as a motion.button so the whole card is clickable", () => {
    expect(src).toMatch(/motion\.button/);
  });

  it("uses poster card spring stiffness 380 damping 26 (DESIGN.md §Motion)", () => {
    expect(src).toMatch(/stiffness.*380|380.*stiffness/);
    expect(src).toMatch(/damping.*26|26.*damping/);
  });

  it("uses poster card hover lift (y: -3) and tap scale (0.995)", () => {
    expect(src).toMatch(/y:\s*-3/);
    expect(src).toMatch(/scale:\s*0\.995/);
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

  it("has a Jason Dijols LinkedIn link that stops propagation", () => {
    expect(src).toMatch(/Jason Dijols/);
    expect(src).toMatch(/linkedin\.com\/in\/jasondijols/);
    expect(src).toMatch(/stopPropagation/);
  });

  it("shows the How I build affordance as visual-only (parent button handles nav)", () => {
    expect(src).toMatch(/How I build/);
  });
});
