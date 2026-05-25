import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("LessonHost", () => {
  it("fallback states use h-[100dvh] not h-screen (DESIGN.md §Layout)", () => {
    const src = readFileSync(resolve(__dirname, "LessonHost.tsx"), "utf-8");
    const count = (src.match(/\bh-screen\b/g) ?? []).length;
    expect(count).toBe(0);
  });

  it("error-state button has focus-visible ring (DESIGN.md §Accessibility)", () => {
    const src = readFileSync(resolve(__dirname, "LessonHost.tsx"), "utf-8");
    expect(src).toMatch(/focus-visible:ring-2/);
    expect(src).toMatch(/focus-visible:ring-sb-accent\b/);
  });
});
