import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "BrainliftCard.tsx"), "utf-8");

describe("BrainliftCard — DESIGN.md compliance", () => {
  it("exports BrainliftCard", () => {
    expect(src).toMatch(/export.*BrainliftCard/);
  });

  it("accepts onActivate and className props", () => {
    expect(src).toMatch(/onActivate/);
    expect(src).toMatch(/className/);
  });

  it("uses poster card spring stiffness 380 damping 26 (DESIGN.md §Motion)", () => {
    expect(src).toMatch(/stiffness.*380|380.*stiffness/);
    expect(src).toMatch(/damping.*26|26.*damping/);
  });

  it("uses focus-visible:ring-sb-accent (DESIGN.md §Accessibility)", () => {
    expect(src).toMatch(/focus-visible:ring-sb-accent/);
  });

  it("uses font-mono for labels (DESIGN.md §Typography)", () => {
    expect(src).toMatch(/\bfont-mono\b/);
  });

  it("has BRAINLIFT eyebrow text", () => {
    expect(src).toMatch(/BRAINLIFT/i);
  });

  it("uses parchment gradient background", () => {
    expect(src).toMatch(/radial-gradient/);
    expect(src).toMatch(/F5EFE2|EFE7DA|E8DECC/);
  });

  it("does not use deprecated font-display (DESIGN.md §Typography)", () => {
    expect(src).not.toMatch(/\bfont-display\b/);
  });
});
