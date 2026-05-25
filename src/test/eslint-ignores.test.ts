import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("eslint.config.js ignores", () => {
  it("ignores ASL-ComputerVision workstream to prevent linting Python venv JS", () => {
    const config = readFileSync(resolve(__dirname, "../../eslint.config.js"), "utf-8");
    expect(config).toMatch(/ASL-ComputerVision/);
  });
});
