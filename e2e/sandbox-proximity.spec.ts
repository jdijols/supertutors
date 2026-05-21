import { expect, test } from "@playwright/test";

/**
 * P2.10 — Slice + compare smoke test.
 *
 * Drives the sandbox preview end-to-end:
 *   1. Switch to cutter, slice the whole pizza into halves.
 *   2. Switch to glove, drag the right half close to the left half.
 *   3. Verify the proximity indicator surfaces an `equal` cluster
 *      (`1/2 + 1/2 = 1` admits a partition into two halves → equal).
 *
 * Uses Playwright's native mouse events so framer-motion's pointer-capture
 * drag actually fires (this is the test surface I couldn't reach via
 * preview_eval pointer dispatch).
 *
 * Desktop-Chrome only: iPad Safari emulation in Playwright can't drive
 * framer-motion's `setPointerCapture` from synthesized touch events. Real
 * iPad coverage of this flow comes from PT.4 device inspection.
 */
test.describe("sandbox proximity detection", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Drag via synthesized touch events doesn't reach framer-motion's pointer capture on webkit; covered manually on real iPad in PT.4",
  );
  test("slice → drag close → equal cluster indicator appears", async ({
    page,
  }) => {
    await page.goto("/preview/sandbox");

    const pieces = page.locator("[data-piece-id]");
    await expect(pieces).toHaveCount(1);

    // 1. Switch to cutter.
    await page.getByRole("button", { name: /pizza cutter/i }).click();

    // 2. Click the whole pizza in its center — fires the slicer on pointerup.
    const whole = pieces.first();
    await whole.click();

    // 3. After the slice, we have 2 halves.
    await expect(pieces).toHaveCount(2);

    // No proximity indicator yet — the 32px gap exceeds the 20px default
    // threshold (correct: the kid hasn't moved them together).
    await expect(
      page.locator("[data-proximity-comparison]"),
    ).toHaveCount(0);

    // 4. Switch to glove.
    await page.getByRole("button", { name: /glove/i }).click();

    // 5. Read both pieces' positions, then drag the right one leftward so
    //    its left edge ends up within 20px of the left one's right edge.
    const lefts = await pieces.evaluateAll((els) =>
      (els as HTMLElement[]).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          id: el.dataset.pieceId,
          left: r.left,
          right: r.right,
          top: r.top,
          width: r.width,
          height: r.height,
        };
      }),
    );
    lefts.sort((a, b) => a.left - b.left);
    const leftPiece = lefts[0];
    const rightPiece = lefts[1];

    // Target: right piece's left edge sits ~10px past the left piece's right
    // edge (gap of 10px, well under the 20px threshold). Existing gap is
    // rightPiece.left − leftPiece.right; we shift by that minus 10.
    const currentGap = rightPiece.left - leftPiece.right;
    const desiredGap = 10;
    const shift = -(currentGap - desiredGap); // negative = leftward

    const startX = rightPiece.left + rightPiece.width / 2;
    const startY = rightPiece.top + rightPiece.height / 2;
    const endX = startX + shift;
    const endY = startY;

    // Native mouse drag — Chrome only (see test.skip above). Multiple
    // intermediate moves help framer-motion's drag threshold trigger
    // reliably across versions.
    const steps = 12;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(
        startX + (shift * i) / steps,
        startY,
        { steps: 2 },
      );
    }
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // 6. The proximity indicator should now appear, marking the cluster
    //    as `equal` (1/2 + 1/2 = 1 admits a {half, half} partition).
    const equalIndicator = page.locator(
      '[data-proximity-comparison="equal"]',
    );
    await expect(equalIndicator).toHaveCount(1);
    await expect(equalIndicator).toContainText("≡");
  });
});
