import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("UserMenu — DESIGN.md compliance", () => {
  it("avatar button meets 56px touch target (DESIGN.md §Component Patterns)", () => {
    const src = readFileSync(resolve(__dirname, "UserMenu.tsx"), "utf-8");
    expect(src).toMatch(/w-14\b/);
    expect(src).toMatch(/h-14\b/);
  });

  it("uses focus-visible:ring-sb-accent (DESIGN.md §Accessibility)", () => {
    const src = readFileSync(resolve(__dirname, "UserMenu.tsx"), "utf-8");
    expect(src).toMatch(/focus-visible:ring-2/);
    expect(src).toMatch(/focus-visible:ring-sb-accent\b/);
  });

  it("uses spring stiffness 600 damping 22 for chrome (DESIGN.md §Motion)", () => {
    const src = readFileSync(resolve(__dirname, "UserMenu.tsx"), "utf-8");
    expect(src).toMatch(/stiffness.*600|600.*stiffness/);
    expect(src).toMatch(/damping.*22|22.*damping/);
  });

  it("open state uses active=dark rule (bg-sb-ink text-white) (DESIGN.md §Color)", () => {
    const src = readFileSync(resolve(__dirname, "UserMenu.tsx"), "utf-8");
    expect(src).toMatch(/bg-sb-ink.*text-white|text-white.*bg-sb-ink/);
  });
});
