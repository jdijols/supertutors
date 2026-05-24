import { expect, test } from "@playwright/test";

/**
 * P1.5 — Beat 6 (AHA) happy-path smoke.
 *
 * Drives the full vertical slice: onboard → enter the lesson → walk the
 * machine via demo-mode dev controls (SLICED 1/2 → PROXIMITY equal →
 * ANIMATION_DONE) → expect Freddy's hero reveal line and the transition
 * out of `aha` into the top-level `check` beat.
 *
 * Uses `?demo=true` to surface the LessonDevControls panel — until the
 * real Table emits SLICED / PROXIMITY events, this is the only way to
 * test the wiring end-to-end.
 *
 * Stubs `/audio/*.mp3` and `/api/voice` to 404 so AudioEngine's
 * fire-immediately-on-failure path fires DIALOGUE_DONE deterministically.
 * The real audio is verified manually + via the AudioEngine unit tests;
 * here we only care about the state-machine flow.
 */
test.describe("Beat 6 (AHA) happy path", () => {
  test.beforeEach(async ({ page }) => {
    // Force audio failure so DIALOGUE_DONE fires the moment any line is
    // requested — keeps the state machine flow deterministic.
    await page.route(/\/audio\/.*\.mp3$/, (route) =>
      route.fulfill({ status: 404 }),
    );
    await page.route(/\/api\/voice/, (route) =>
      route.fulfill({ status: 404 }),
    );
  });

  /**
   * Helper — enter /lesson via the landing CTA + demo flag in sessionStorage,
   * then run onboarding. Direct page-load of /lesson leaves the greeting
   * bubble's framer-motion animation stuck at the `initial` style for reasons
   * not fully understood (autoplay-policy interaction?), so we always
   * navigate via the landing route — matches smoke.spec.ts which is reliable.
   */
  async function enterLessonWithDemo(page: import("@playwright/test").Page) {
    await page.goto("/");
    await page.evaluate(() =>
      window.sessionStorage.setItem("supertutors:demoMode", "1"),
    );
    await page
      .getByRole("button", {
        name: /start the fractions lesson with freddy/i,
      })
      .click();
    await expect(page).toHaveURL(/\/lessons\/freddy-fractions/);
    // Greeting bubble auto-dismisses when its audio ends — with audio
    // stubbed to 404 in beforeEach, that's immediate. Wait for the name
    // input to surface instead of racing the bubble's exit animation
    // with a manual click.
    const nameInput = page.getByPlaceholder(/type your name/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill("TestKid");
    await page
      .getByRole("button", { name: /send name: testkid/i })
      .click();
    // The default lesson body is now `<LessonExploration>` (proximity-driven
    // Act 1). Beat 6 lives behind the `?beat=aha` URL flag — demo-mode key
    // "6" navigates there. Press it after onboarding so `<LessonMachineRoot>`
    // mounts and the dev controls become available.
    await page.keyboard.press("6");
    await expect(page).toHaveURL(/beat=aha/);
  }
  test("setup → slice → compare → animation → reveal → check", async ({
    page,
  }) => {
    await enterLessonWithDemo(page);

    // 2. Wait for onboarding_response to finish (audio fails fast in dev,
    //    fires onDone immediately → onboardingDone flips → machine mounts).
    const devControls = page.getByTestId("lesson-dev-controls");
    await expect(devControls).toBeVisible({ timeout: 5_000 });
    // Wait until the machine has fully entered `waiting_for_slice` (not
    // just `aha.setup`). RESET fires on mount and the setup-state
    // dialogue plays — only after it completes does the machine reach a
    // state that accepts SLICED events.
    await expect(devControls).toContainText("waiting_for_slice", {
      timeout: 5_000,
    });

    // 3. Drive Beat 6 via dev buttons.
    await page.getByRole("button", { name: /SLICED \(1\/2\)/ }).click();
    await expect(devControls).toContainText("sliced_correctly");

    // The compare-prompt audio fires onDone immediately on 404 in dev →
    // machine advances to waiting_for_compare.
    await expect(devControls).toContainText("waiting_for_compare", {
      timeout: 3_000,
    });

    await page.getByRole("button", { name: /PROXIMITY \(equal\)/ }).click();
    await expect(devControls).toContainText("aha_triggered");

    await page.getByRole("button", { name: /ANIMATION_DONE/ }).click();
    // celebrating plays aha_reveal — bubble should contain the hero line
    // with the name interpolated.
    const heroLine = page
      .getByText(/Whoa, kid! Look at that — one half is the SAME as two quarters/i);
    await expect(heroLine).toBeVisible({ timeout: 3_000 });

    // After aha_reveal's DIALOGUE_DONE the machine exits aha onto top-level
    // `check`. State string in the dev panel changes from {"aha":"…"} to
    // a plain "check".
    await expect(devControls).toContainText('"check"', { timeout: 3_000 });
  });

  test("wrong slice → recovery → loop back to waiting_for_slice", async ({
    page,
  }) => {
    await enterLessonWithDemo(page);

    const devControls = page.getByTestId("lesson-dev-controls");
    await expect(devControls).toBeVisible({ timeout: 5_000 });
    await expect(devControls).toContainText("waiting_for_slice", {
      timeout: 3_000,
    });

    await page.getByRole("button", { name: /SLICED \(1\/4\).*wrong/ }).click();
    await expect(devControls).toContainText("wrong_slice");
    // Recovery line fires DIALOGUE_DONE on audio fail → back to wait.
    await expect(devControls).toContainText("waiting_for_slice", {
      timeout: 3_000,
    });
  });
});
