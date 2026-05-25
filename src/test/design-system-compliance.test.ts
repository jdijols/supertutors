/**
 * DESIGN.md compliance sweeps — broad static analysis to catch token drift.
 * These tests protect against accidental re-introduction of banned tokens
 * across the platform and non-Freddy lesson surfaces.
 *
 * Each group targets one DESIGN.md rule. Freddy lesson files are excluded
 * because they are in "regression check" mode and some pre-existing
 * viewport/color patterns are accepted there.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");

function collectTsx(dir: string, exclude: RegExp[] = []): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (exclude.some((r) => r.test(full))) continue;
      results.push(...collectTsx(full, exclude));
    } else if (full.endsWith(".tsx") && !full.includes(".test.")) {
      results.push(full);
    }
  }
  return results;
}

const PLATFORM_AND_ASL = collectTsx(join(ROOT, "src"), [
  /freddy-fractions/,
  /auth/,
  /previews/, // dev-only preview routes
]);

function readAll(files: string[]): { path: string; src: string }[] {
  return files.map((path) => ({ path, src: readFileSync(path, "utf-8") }));
}

const files = readAll(PLATFORM_AND_ASL);

describe("DESIGN.md §Typography — banned font classes", () => {
  it("no file uses font-display (deprecated, use font-mono)", () => {
    for (const { path, src } of files) {
      expect(src, `${path}: no font-display`).not.toMatch(/\bfont-display\b/);
    }
  });

  it("no file uses font-body (deprecated, use font-sans)", () => {
    for (const { path, src } of files) {
      expect(src, `${path}: no font-body`).not.toMatch(/\bfont-body\b/);
    }
  });
});

describe("DESIGN.md §Layout — viewport units", () => {
  it("no file uses h-screen (use h-[100dvh])", () => {
    for (const { path, src } of files) {
      expect(src, `${path}: no h-screen`).not.toMatch(/\bh-screen\b/);
    }
  });
});

describe("DESIGN.md §Color — banned token prefixes", () => {
  it("no file uses tomato-* tokens (deprecated portal palette)", () => {
    for (const { path, src } of files) {
      expect(src, `${path}: no tomato-*`).not.toMatch(/\btomato-[0-9]/);
    }
  });

  it("no file uses portal-* tokens (deprecated portal palette)", () => {
    for (const { path, src } of files) {
      expect(src, `${path}: no portal-*`).not.toMatch(/\bportal-[a-z]/);
    }
  });
});

describe("DESIGN.md §Accessibility — focus ring pattern", () => {
  it("all focus-visible:ring-2 blocks also include ring-offset-2", () => {
    for (const { path, src } of files) {
      const ringBlocks = src.match(/focus-visible:ring-2[^"'`\s]{0,200}/g) ?? [];
      for (const block of ringBlocks) {
        // Each ring-2 block must also have ring-offset on the same className string
        if (!block.includes("ring-offset")) {
          // Check if ring-offset appears nearby in the same className block
          const idx = src.indexOf(block);
          const context = src.slice(Math.max(0, idx - 20), idx + block.length + 80);
          expect(context, `${path}: ring-2 block missing ring-offset`).toMatch(
            /ring-offset-2/
          );
        }
      }
    }
  });
});
