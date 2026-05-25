import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ReferenceVideoModal", () => {
  it("close button meets 56px minimum touch target (DESIGN.md §Component Patterns)", () => {
    const src = readFileSync(resolve(__dirname, "ReferenceVideoModal.tsx"), "utf-8");
    // w-7 = 28px — too small. Minimum is w-14 (56px) per DESIGN.md.
    expect(src).not.toMatch(/\bw-7\b/);
    expect(src).not.toMatch(/\bh-7\b/);
  });
});
