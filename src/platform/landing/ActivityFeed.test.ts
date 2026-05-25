import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ActivityFeed", () => {
  it("ResultIcon uses design-system palette tokens, not generic Tailwind colors (DESIGN.md §Color)", () => {
    const src = readFileSync(resolve(__dirname, "ActivityFeed.tsx"), "utf-8");
    expect(src).not.toMatch("text-green-");
    expect(src).not.toMatch("text-red-");
    expect(src).not.toMatch("text-yellow-");
  });
});
