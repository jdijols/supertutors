import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("PromptCard — DESIGN.md compliance", () => {
  it("uses font-mono for label and sign display (DESIGN.md §Typography)", () => {
    const src = readFileSync(resolve(__dirname, "PromptCard.tsx"), "utf-8");
    expect(src).toMatch(/\bfont-mono\b/);
    expect(src).not.toMatch(/\bfont-display\b/);
  });

  it("uses sb-* palette tokens for colors (DESIGN.md §Color)", () => {
    const src = readFileSync(resolve(__dirname, "PromptCard.tsx"), "utf-8");
    expect(src).toMatch(/\bsb-/);
    expect(src).not.toMatch(/\btomato-/);
  });
});
