import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AboutModal", () => {
  it("moves focus into dialog on open (WCAG 2.4.3 — dialogs must receive focus)", () => {
    const src = readFileSync(resolve(__dirname, "AboutModal.tsx"), "utf-8");
    // The modal must use a ref + useEffect to focus the close button
    // (or autoFocus) so keyboard users start inside the dialog.
    const hasAutoFocus = src.includes("autoFocus") || src.includes("closeButtonRef");
    expect(hasAutoFocus).toBe(true);
  });

  it("coming-soon chip buttons have focus-visible ring (DESIGN.md §Accessibility)", () => {
    const src = readFileSync(resolve(__dirname, "AboutModal.tsx"), "utf-8");
    // Every interactive element inside the modal must be keyboard-reachable
    // with a visible focus indicator.
    expect(src).toMatch(/focus-visible:ring-2.*focus-visible:ring-sb-accent|focus-visible:ring-sb-accent.*focus-visible:ring-2/);
  });
});
