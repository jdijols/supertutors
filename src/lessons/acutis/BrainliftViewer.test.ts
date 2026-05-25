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

  it("provides transient success feedback for copy + download", () => {
    // The useTransientPulse hook drives the brief "done" state after
    // fire-and-forget actions. Silent success was the bug we're fixing.
    expect(src()).toMatch(/useTransientPulse/);
    expect(src()).toMatch(/flashCopied/);
    expect(src()).toMatch(/flashDownloaded/);
  });

  it("success state uses the inverted surface treatment (bg-sb-paper text-sb-ink)", () => {
    // Matches the DESIGN.md "active = max contrast with page surface"
    // rule for the dark/ink surface family.
    expect(src()).toMatch(/iconButtonSuccess/);
    expect(src()).toMatch(/bg-sb-paper text-sb-ink/);
  });

  it("renders a checkmark icon when an action succeeds", () => {
    expect(src()).toMatch(/function CheckIcon/);
    expect(src()).toMatch(/copied \? <CheckIcon \/> : <CopyIcon \/>/);
    expect(src()).toMatch(/downloaded \? <CheckIcon \/> : <DownloadIcon \/>/);
  });

  it("announces success to assistive tech via aria-live polite region", () => {
    expect(src()).toMatch(/aria-live="polite"/);
    expect(src()).toMatch(/sr-only/);
    expect(src()).toMatch(/Markdown copied to clipboard/);
    expect(src()).toMatch(/Markdown file downloaded/);
  });
});
