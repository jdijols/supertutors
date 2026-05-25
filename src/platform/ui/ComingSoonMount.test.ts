import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ComingSoonMount", () => {
  it("Back button has focus-visible ring with ring-offset-2 (DESIGN.md §Accessibility)", () => {
    const src = readFileSync(resolve(__dirname, "ComingSoonMount.tsx"), "utf-8");
    expect(src).toMatch(/focus-visible:ring-2/);
    expect(src).toMatch(/focus-visible:ring-sb-accent/);
    expect(src).toMatch(/focus-visible:ring-offset-2/);
  });
});
