import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("LessonGrid — lesson slot verification", () => {
  it("includes all three lesson slugs (freddy-fractions, asl, acutis)", () => {
    const src = readFileSync(resolve(__dirname, "LessonGrid.tsx"), "utf-8");
    expect(src).toMatch(/freddy-fractions/);
    expect(src).toMatch(/\basl\b/);
    expect(src).toMatch(/acutis/);
  });

  it("wraps cards in a section with aria-label (WCAG §Landmark Roles)", () => {
    const src = readFileSync(resolve(__dirname, "LessonGrid.tsx"), "utf-8");
    expect(src).toMatch(/aria-label.*Lessons|Lessons.*aria-label/);
  });

  it("uses responsive grid (md:grid-cols-3) for three-card layout", () => {
    const src = readFileSync(resolve(__dirname, "LessonGrid.tsx"), "utf-8");
    expect(src).toMatch(/md:grid-cols-3/);
  });
});
