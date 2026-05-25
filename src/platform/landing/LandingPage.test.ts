import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "LandingPage.tsx"), "utf-8");

describe("LandingPage — DESIGN.md compliance", () => {
  it("uses h-[100dvh] not h-screen (DESIGN.md §Layout)", () => {
    expect(src).not.toMatch(/\bh-screen\b/);
    expect(src).toMatch(/h-\[100dvh\]/);
  });

  it("does not use font-display (DESIGN.md §Typography)", () => {
    expect(src).not.toMatch(/\bfont-display\b/);
  });
});

describe("LandingPage — bento layout", () => {
  it("uses bg-sb-ink dark surface", () => {
    expect(src).toMatch(/bg-sb-ink/);
  });

  it("mounts BrainliftCard", () => {
    expect(src).toMatch(/BrainliftCard/);
  });

  it("mounts ASLPosterCard", () => {
    expect(src).toMatch(/ASLPosterCard/);
  });

  it("mounts FreddyPosterCard", () => {
    expect(src).toMatch(/FreddyPosterCard/);
  });

  it("mounts AboutCard", () => {
    expect(src).toMatch(/AboutCard/);
  });

  it("uses CSS grid with 5 columns", () => {
    expect(src).toMatch(/grid-cols-5/);
  });

  it("has 2-row grid", () => {
    expect(src).toMatch(/grid-rows-2/);
  });

  it("BrainliftCard spans 2 columns (col-span-2)", () => {
    expect(src).toMatch(/col-span-2/);
  });

  it("ASL and Freddy span 3 columns (col-span-3)", () => {
    expect(src).toMatch(/col-span-3/);
  });

  it("uses SuperTutorsLockup with inline size", () => {
    expect(src).toMatch(/size="inline"/);
  });

  it("does not import InfoToggle (removed from bento layout)", () => {
    expect(src).not.toMatch(/InfoToggle/);
  });

  it("does not import AboutModal (replaced by AboutCard)", () => {
    expect(src).not.toMatch(/AboutModal/);
  });

  it("does not import LessonCarousel (replaced by bento grid)", () => {
    expect(src).not.toMatch(/LessonCarousel/);
  });

  it("uses ring-offset-sb-ink for dark surface focus rings", () => {
    expect(src).toMatch(/ring-offset-sb-ink/);
  });
});
