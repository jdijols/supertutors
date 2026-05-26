import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = () => readFileSync(resolve(__dirname, "BrainliftViewer.tsx"), "utf-8");

describe("BrainliftViewer — structure", () => {
  it("exports BrainliftViewer component", () => {
    expect(src()).toMatch(/export.*function BrainliftViewer|export.*BrainliftViewer/);
  });

  it("accepts a markdown prop", () => {
    expect(src()).toMatch(/markdown/);
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

  it("wraps headings into <details> via remark plugin (not raw HTML in source)", () => {
    // Why this matters: putting <details>/<summary> directly in markdown
    // source causes CommonMark to treat the body as a raw HTML block,
    // which kills list parsing and indentation inside. The fix is to
    // keep markdown source clean (## / ### / #### headings) and wrap
    // them in <details> at the AST level via remark-rehype hName.
    expect(src()).toMatch(/remarkHeadingsToDetails/);
    expect(src()).toMatch(/hName: "details"/);
    expect(src()).toMatch(/hName: "summary"/);
    expect(src()).not.toMatch(/rehype-raw/);
  });

  it("expand all / collapse all walks the rendered article via ref", () => {
    expect(src()).toMatch(/articleRef/);
    expect(src()).toMatch(/querySelectorAll\("details"\)/);
    expect(src()).toMatch(/Expand all/);
    expect(src()).toMatch(/Collapse all/);
  });
});

describe("Acutis-Institute_Brainlift.md — source format", () => {
  // The markdown source MUST use heading syntax (not raw <details> HTML).
  // Raw HTML in markdown breaks list parsing inside the body.
  const brainliftPath = resolve(
    __dirname,
    "../../../Acutis-Institute/Acutis-Institute_Brainlift.md"
  );
  const brainlift = () => readFileSync(brainliftPath, "utf-8");

  it("has no raw <details> tags in source (toggles come from headings)", () => {
    expect(brainlift()).not.toMatch(/<details>/);
    expect(brainlift()).not.toMatch(/<summary>/);
  });

  it("has the 7 expected top-level (H2) sections", () => {
    const md = brainlift();
    expect(md).toMatch(/^## Owners$/m);
    expect(md).toMatch(/^## Purpose$/m);
    expect(md).toMatch(/^## Critical Open Question$/m);
    expect(md).toMatch(/^## DOK 4 — Spiky POVs$/m);
    expect(md).toMatch(/^## DOK 3 — Insights$/m);
    expect(md).toMatch(/^## Experts$/m);
    expect(md).toMatch(/^## DOK 2 — Knowledge Tree$/m);
  });

  it("has 5 SPOVs, 5 Insights, 5 Experts, 3 Categories as H3", () => {
    const md = brainlift();
    expect(md.match(/^### SPOV\d+/gm)?.length).toBe(5);
    expect(md.match(/^### Insight \d+/gm)?.length).toBe(5);
    expect(md.match(/^### Expert \d+/gm)?.length).toBe(5);
    expect(md.match(/^### Category \d+/gm)?.length).toBe(3);
  });

  it("has H4 sub-toggles for Supporting Research and Connections", () => {
    const md = brainlift();
    expect(md.match(/^#### Supporting Research$/gm)?.length).toBe(5);
    expect(md.match(/^#### Connections$/gm)?.length).toBe(5);
  });
});
