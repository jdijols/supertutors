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
});
