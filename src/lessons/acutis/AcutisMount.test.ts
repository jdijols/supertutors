import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(__dirname, "Mount.tsx"), "utf-8");

describe("Acutis Mount — BrainliftViewer integration", () => {
  it("imports BrainliftViewer", () => {
    expect(src).toMatch(/BrainliftViewer/);
  });

  it("imports markdown via ?raw", () => {
    expect(src).toMatch(/\?raw/);
  });

  it("no longer references ComingSoonMount", () => {
    expect(src).not.toMatch(/ComingSoonMount/);
  });
});
