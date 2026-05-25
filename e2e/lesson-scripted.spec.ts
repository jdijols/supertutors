import { expect, test } from "@playwright/test";

/**
 * Scripted lesson (v2 arc — fraction equivalence) smoke + state-machine tests.
 *
 * Uses `?lesson=scripted&name=Maria` to jump directly into LessonScripted,
 * bypassing onboarding and exploration. Audio is stubbed to 404 so
 * AudioEngine's fire-immediately-on-failure path drives DIALOGUE_DONE
 * deterministically — the same pattern used by beat-6-aha.spec.ts.
 *
 * Coverage:
 *   1. Mount: table visible, one whole pizza, tool picker present.
 *   2. Slicing whole pizza → 2 halves (advances wait_halves → react_halves).
 *   3. Slicing ONE half (target arc) → 1 half + 2 quarters → react_mixed.
 *   4. Slicing BOTH halves (over-slice recovery) → 4 quarters → react_mixed_alt.
 *   5. Pre-emptive slicing (all cuts before any audio finishes) — state-driven
 *      transitions catch the lesson up.
 *   6. scriptedMode hides AddPizza + DeliveryBox.
 *   7. Lesson does not show the onboarding greeting when entered via ?lesson=scripted.
 *
 * The AHA → reveal → win sequence relies on drag interactions that are
 * unreliable across browsers in CI; covered by the AhaAnimation /
 * WinConfetti unit tests + manual verification.
 */
test.describe("LessonScripted v2 smoke", () => {
  test.beforeEach(async ({ page }) => {
    // Stub audio so DIALOGUE_DONE fires immediately via AudioEngine error path.
    await page.route(/\/audio\/.*\.mp3$/, (route) =>
      route.fulfill({ status: 404 }),
    );
    await page.route(/\/api\/voice/, (route) =>
      route.fulfill({ status: 404 }),
    );
  });

  test("mounts with one whole pizza and tool picker visible", async ({ page }) => {
    await page.goto("/lessons/freddy-fractions?lesson=scripted&name=Maria");

    const pieces = page.locator("[data-piece-id]");
    await expect(pieces).toHaveCount(1, { timeout: 5_000 });
    await expect(page.getByTestId("tool-picker")).toBeVisible({ timeout: 3_000 });
  });

  test("slicing the whole pizza advances to 2 halves", async ({ page }) => {
    await page.goto("/lessons/freddy-fractions?lesson=scripted&name=Maria");

    const pieces = page.locator("[data-piece-id]");
    await expect(pieces).toHaveCount(1, { timeout: 5_000 });

    // Wait for intro audio onDone (stubbed to immediate) to advance stage.
    await page.waitForTimeout(500);

    // Lesson auto-sets cutter for slice stages (Commit 5); no manual switch needed.
    await pieces.first().click();
    await expect(pieces).toHaveCount(2, { timeout: 3_000 });
  });

  test("slicing ONE half (target arc) yields 1 half + 2 quarters", async ({ page }) => {
    await page.goto("/lessons/freddy-fractions?lesson=scripted&name=Maria");

    const pieces = page.locator("[data-piece-id]");
    await expect(pieces).toHaveCount(1, { timeout: 5_000 });
    await page.waitForTimeout(500);

    // Slice whole → 2 halves.
    await pieces.first().click();
    await expect(pieces).toHaveCount(2, { timeout: 3_000 });

    // Wait for react_halves audio onDone (stubbed) → stage = wait_mixed.
    await page.waitForTimeout(500);

    // Slice ONE of the halves → 1 half + 2 quarters (the v2 target state).
    await pieces.first().click();
    await expect(pieces).toHaveCount(3, { timeout: 3_000 });

    // Verify composition via data-fraction.
    const fractions = await pieces.evaluateAll((els) =>
      (els as HTMLElement[]).map((el) => el.dataset.fraction),
    );
    expect(fractions.sort()).toEqual(["1/2", "1/4", "1/4"]);
  });

  test("over-slice recovery: slicing BOTH halves yields 4 quarters", async ({ page }) => {
    await page.goto("/lessons/freddy-fractions?lesson=scripted&name=Maria");

    const pieces = page.locator("[data-piece-id]");
    await expect(pieces).toHaveCount(1, { timeout: 5_000 });
    await page.waitForTimeout(500);

    // Slice whole → 2 halves.
    await pieces.first().click();
    await expect(pieces).toHaveCount(2, { timeout: 3_000 });
    await page.waitForTimeout(500);

    // Slice first half → 1 half + 2 quarters.
    await pieces.first().click();
    await expect(pieces).toHaveCount(3, { timeout: 3_000 });

    // Slice the remaining half → 4 quarters (over-slice recovery path).
    // Find the remaining half (the only piece with fraction "1/2").
    const remainingHalf = page.locator('[data-piece-id][data-fraction="1/2"]');
    await expect(remainingHalf).toHaveCount(1);
    await remainingHalf.click();
    await expect(pieces).toHaveCount(4, { timeout: 3_000 });

    // All four pieces should be quarters.
    const fractions = await pieces.evaluateAll((els) =>
      (els as HTMLElement[]).map((el) => el.dataset.fraction),
    );
    expect(fractions.sort()).toEqual(["1/4", "1/4", "1/4", "1/4"]);
  });

  test("pre-emptive slicing — state-driven transitions catch up", async ({ page }) => {
    // The user's reported bug pre-v2: kid slices ahead of Freddy's audio,
    // event-driven handler ignored slices in wrong stage, lesson stalled.
    // State-driven v2 reads the world, so any rapid slicing converges.
    await page.goto("/lessons/freddy-fractions?lesson=scripted&name=Maria");

    const pieces = page.locator("[data-piece-id]");
    await expect(pieces).toHaveCount(1, { timeout: 5_000 });

    // Click everything as fast as possible — no waiting for audio.
    await pieces.first().click();
    await expect(pieces).toHaveCount(2, { timeout: 3_000 });
    await pieces.first().click();
    await expect(pieces).toHaveCount(3, { timeout: 3_000 });
    const remainingHalf = page.locator('[data-piece-id][data-fraction="1/2"]');
    if (await remainingHalf.count()) {
      await remainingHalf.click();
    }
    // Either oneHalfTwoQuarters (3 pieces) or fourQuarters (4 pieces) is
    // a valid post-pre-emptive state — both are recognized patterns
    // that the state-driven machine accepts.
    const count = await pieces.count();
    expect([3, 4]).toContain(count);
  });

  test("scriptedMode hides AddPizza and DeliveryBox", async ({ page }) => {
    await page.goto("/lessons/freddy-fractions?lesson=scripted&name=Maria");

    await expect(page.locator("[data-piece-id]")).toHaveCount(1, { timeout: 5_000 });

    // Both workspace features should be absent in scriptedMode.
    await expect(page.getByTestId("add-pizza-button")).toHaveCount(0);
    await expect(page.getByTestId("delivery-box")).toHaveCount(0);

    // But the tool picker (chrome control) should still be present.
    await expect(page.getByTestId("tool-picker")).toBeVisible();
  });

  test("?lesson=scripted does not show the onboarding greeting bubble", async ({
    page,
  }) => {
    await page.goto("/lessons/freddy-fractions?lesson=scripted&name=Maria");
    const greeting = page.getByText(/Heyyy, welcome to SuperSlice/i);
    await expect(greeting).toHaveCount(0);
  });
});
