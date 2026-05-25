import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "ASLPosterCard.tsx"), "utf-8");

describe("ASLPosterCard — DESIGN.md compliance", () => {
  it("exports ASLPosterCard", () => {
    expect(src).toMatch(/export.*ASLPosterCard/);
  });

  it("accepts onActivate prop", () => {
    expect(src).toMatch(/onActivate/);
  });

  it("renders Lesson 02 eyebrow", () => {
    expect(src).toMatch(/Lesson 02/i);
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

  it("uses asl sky gradient background", () => {
    expect(src).toMatch(/D5E5F2|BFD5EB|EAF3FA/);
  });

  it("does not show Coming Soon ribbon", () => {
    expect(src).not.toMatch(/Coming Soon/i);
  });

  it("has Start CTA text", () => {
    expect(src).toMatch(/Start/);
  });
});
