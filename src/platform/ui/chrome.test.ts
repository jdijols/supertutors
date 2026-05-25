import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (name: string) =>
  readFileSync(resolve(__dirname, name), "utf-8");

describe("Chrome buttons — DESIGN.md §Component Patterns", () => {
  it("MuteToggle meets 56px minimum touch target", () => {
    const src = read("MuteToggle.tsx");
    expect(src).toMatch(/w-14\b/);
    expect(src).toMatch(/h-14\b/);
  });

  it("ExitButton meets 56px minimum height", () => {
    const src = read("ExitButton.tsx");
    expect(src).toMatch(/h-14\b/);
  });

  it("MuteToggle uses focus-visible:ring-sb-accent (DESIGN.md §Accessibility)", () => {
    const src = read("MuteToggle.tsx");
    expect(src).toMatch(/focus-visible:ring-2/);
    expect(src).toMatch(/focus-visible:ring-sb-accent\b/);
  });

  it("ExitButton uses focus-visible:ring-sb-accent (DESIGN.md §Accessibility)", () => {
    const src = read("ExitButton.tsx");
    expect(src).toMatch(/focus-visible:ring-2/);
    expect(src).toMatch(/focus-visible:ring-sb-accent\b/);
  });

  it("Chrome buttons use shadow-sb-accent-deep/25 not shadow-black (DESIGN.md §Shadow)", () => {
    for (const file of ["MuteToggle.tsx", "ExitButton.tsx"]) {
      const src = read(file);
      expect(src, `${file}: no shadow-black`).not.toMatch(/\bshadow-black\b/);
      expect(src, `${file}: uses sb-accent-deep shadow`).toMatch(/shadow-sb-accent-deep/);
    }
  });
});

describe("MuteToggle — surface-aware active state (DESIGN.md §Surface inversions)", () => {
  const src = read("MuteToggle.tsx");

  it("accepts a surface prop", () => {
    expect(src).toMatch(/surface/);
  });

  it("uses bg-sb-paper text-sb-ink for active state on dark surface", () => {
    expect(src).toMatch(/bg-sb-paper.*text-sb-ink|text-sb-ink.*bg-sb-paper/);
  });

  it("uses ring-offset-sb-ink on dark surface", () => {
    expect(src).toMatch(/ring-offset-sb-ink/);
  });
});

describe("UserMenu — surface-aware active state (DESIGN.md §Surface inversions)", () => {
  const src = read("UserMenu.tsx");

  it("detects dark surface (landing route /)", () => {
    // UserMenu uses useLocation internally — detect ink page vs cream page
    expect(src).toMatch(/pathname.*===.*"\/"|"\/"\s*===.*pathname|onDarkSurface|surface.*dark/);
  });

  it("uses bg-sb-paper text-sb-ink for active state on dark surface", () => {
    expect(src).toMatch(/bg-sb-paper.*text-sb-ink|text-sb-ink.*bg-sb-paper/);
  });

  it("uses ring-offset-sb-ink on dark surface", () => {
    expect(src).toMatch(/ring-offset-sb-ink/);
  });
});
