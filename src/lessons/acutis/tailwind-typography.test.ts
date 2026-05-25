import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("tailwind.config.js — typography plugin", () => {
  const src = readFileSync(resolve(__dirname, "../../../tailwind.config.js"), "utf-8");

  it("registers @tailwindcss/typography plugin", () => {
    expect(src).toMatch(/@tailwindcss\/typography/);
  });
});
