import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (name: string) =>
  readFileSync(resolve(__dirname, name), "utf-8");

describe("FreddyPosterCard — DESIGN.md compliance", () => {
  it("uses focus-visible:ring-sb-accent (DESIGN.md §Accessibility)", () => {
    const src = read("FreddyPosterCard.tsx");
    expect(src).toMatch(/focus-visible:ring-2/);
    expect(src).toMatch(/focus-visible:ring-sb-accent\b/);
  });

  it("uses spring stiffness 380 damping 26 for card (DESIGN.md §Motion)", () => {
    const src = read("FreddyPosterCard.tsx");
    expect(src).toMatch(/stiffness.*380|380.*stiffness/);
    expect(src).toMatch(/damping.*26|26.*damping/);
  });
});
