import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("LessonHost", () => {
  it("fallback states use h-[100dvh] not h-screen (DESIGN.md §Layout)", () => {
    const src = readFileSync(resolve(__dirname, "LessonHost.tsx"), "utf-8");
    const count = (src.match(/\bh-screen\b/g) ?? []).length;
    expect(count).toBe(0);
  });
});
