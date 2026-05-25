import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = () => readFileSync(resolve(__dirname, "BrainliftViewer.tsx"), "utf-8");

describe("BrainliftViewer — structure", () => {
  it("exports BrainliftViewer component", () => {
    expect(src()).toMatch(/export.*function BrainliftViewer|export.*BrainliftViewer/);
  });

  it("accepts markdown and title props", () => {
    expect(src()).toMatch(/markdown/);
    expect(src()).toMatch(/title/);
  });

  it("renders ReactMarkdown in rendered mode", () => {
    expect(src()).toMatch(/ReactMarkdown/);
  });

  it("has rendered/raw toggle buttons", () => {
    expect(src()).toMatch(/rendered/i);
    expect(src()).toMatch(/raw/i);
  });

  it("has copy button with clipboard API", () => {
    expect(src()).toMatch(/clipboard/i);
  });

  it("has download button with blob URL", () => {
    expect(src()).toMatch(/Blob/);
  });

  it("uses font-mono for chrome labels (DESIGN.md §Typography)", () => {
    expect(src()).toMatch(/\bfont-mono\b/);
  });

  it("uses bg-sb-ink dark surface (DESIGN.md §Color)", () => {
    expect(src()).toMatch(/bg-sb-ink/);
  });

  it("active toggle state uses bg-sb-paper text-sb-ink (dark surface inversion)", () => {
    expect(src()).toMatch(/bg-sb-paper/);
    expect(src()).toMatch(/text-sb-ink/);
  });

  it("uses focus-visible:ring-sb-accent for focus rings (DESIGN.md §Accessibility)", () => {
    expect(src()).toMatch(/focus-visible:ring-sb-accent/);
  });
});
