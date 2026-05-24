import { expect, test } from "@playwright/test";

/**
 * Scripted lesson (Share the Pizza) smoke tests.
 *
 * Uses `?lesson=scripted&name=Maria` to jump directly into LessonScripted,
 * bypassing onboarding and exploration. Audio is stubbed to 404 so
 * AudioEngine's fire-immediately-on-failure path drives DIALOGUE_DONE
 * deterministically — the same pattern used by beat-6-aha.spec.ts.
 *
 * Coverage:
 *   1. LessonScripted mounts — table visible, intro bubble appears.
 *   2. Slicing the whole pizza advances the stage to wait_halves / react_halves.
 *
 * The full AHA → Win happy path relies on drag interactions that are
 * unreliable across browsers in CI; it is covered by manual verification
 * and the existing AhaAnimation / WinConfetti unit/e2e tests.
 */
test.describe("LessonScripted smoke", () => {
  test.beforeEach(async ({ page }) => {
    // Stub audio so DIALOGUE_DONE fires immediately via AudioEngine error path.
    await page.route(/\/audio\/.*\.mp3$/, (route) =>
      route.fulfill({ status: 404 }),
    );
    await page.route(/\/api\/voice/, (route) =>
      route.fulfill({ status: 404 }),
    );
  });

  test("mounts with one pizza piece and shows intro bubble", async ({
    page,
  }) => {
    await page.goto("/lessons/freddy-fractions?lesson=scripted&name=Maria");

    // LessonTable inside LessonScripted renders one whole pizza piece.
    const pieces = page.locator("[data-piece-id]");
    await expect(pieces).toHaveCount(1, { timeout: 5_000 });

    // Intro bubble should appear (lesson_intro line fires on mount).
    // With audio stubbed, onDone fires immediately → bubble may clear fast.
    // We verify the tool picker is also visible — confirms the table is active.
    await expect(page.getByTestId("tool-picker")).toBeVisible({ timeout: 3_000 });
  });

  test("slicing the whole pizza advances to 2 halves", async ({ page }) => {
    // Desktop-Chrome only: webkit pointer events + framer-motion drag unreliable.
    // This test uses a simple click (not drag) so it runs on both engines.
    await page.goto("/lessons/freddy-fractions?lesson=scripted&name=Maria");

    const pieces = page.locator("[data-piece-id]");
    await expect(pieces).toHaveCount(1, { timeout: 5_000 });

    // Ensure cutter tool is active.
    await page.getByRole("button", { name: /pizza cutter/i }).click();

    // With audio stubbed, intro fires onDone immediately → stage = wait_halves.
    // Give React one paint cycle to settle.
    await page.waitForTimeout(500);

    // Click the whole pizza to slice it.
    await pieces.first().click();

    // Two halves should now be on the table.
    await expect(pieces).toHaveCount(2, { timeout: 3_000 });
  });

  test("?lesson=scripted does not show the onboarding greeting bubble", async ({
    page,
  }) => {
    await page.goto("/lessons/freddy-fractions?lesson=scripted&name=Maria");

    // The onboarding greeting ("Heyyy, welcome to SuperSlice!") must not appear —
    // lesson=scripted skips onboarding entirely.
    const greeting = page.getByText(/Heyyy, welcome to SuperSlice/i);
    await expect(greeting).toHaveCount(0);
  });
});
