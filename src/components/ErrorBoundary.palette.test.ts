import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ErrorBoundary", () => {
  it("fallback screen uses platform palette tokens, not lesson-world colors (DESIGN.md §Color)", () => {
    const src = readFileSync(resolve(__dirname, "ErrorBoundary.tsx"), "utf-8");
    // ErrorBoundary is a platform-level component — lesson-world bg-mozzarella colors
    // and h-screen belong to lesson views, not platform chrome.
    expect(src).not.toMatch("bg-mozzarella-");
    expect(src).not.toMatch(/\bh-screen\b/);
    expect(src).not.toMatch(/\bmin-h-screen\b/);
  });

  it("does not use banned tomato-* tokens (DESIGN.md §Color — tomato is deprecated)", () => {
    const src = readFileSync(resolve(__dirname, "ErrorBoundary.tsx"), "utf-8");
    expect(src).not.toMatch(/\btomato-/);
  });

  it("does not use deprecated font-display class (DESIGN.md §Typography)", () => {
    const src = readFileSync(resolve(__dirname, "ErrorBoundary.tsx"), "utf-8");
    expect(src).not.toMatch(/\bfont-display\b/);
  });

  it("CTA button uses focus-visible:ring-2 ring-sb-accent (DESIGN.md §Accessibility)", () => {
    const src = readFileSync(resolve(__dirname, "ErrorBoundary.tsx"), "utf-8");
    expect(src).toMatch(/focus-visible:ring-2/);
    expect(src).toMatch(/focus-visible:ring-sb-accent\b/);
  });
});
