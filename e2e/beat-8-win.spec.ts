import { expect, test } from "@playwright/test";

/**
 * Beat 8 (Win) smoke test.
 *
 * Validates the WIN_DEMO jump: pressing key 8 in demo mode after onboarding
 * triggers React Router navigation to ?beat=win, which sends WIN_DEMO to
 * the tutorMachine (without a full page reload so Zustand state is preserved),
 * machine transitions to `win` state, and WinConfetti renders.
 *
 * Audio stubbed to 404 so DIALOGUE_DONE fires immediately and machine flow
 * is deterministic.
 */
test.describe("Beat 8 (Win) — confetti jump", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/audio\/.*\.mp3$/, (route) =>
      route.fulfill({ status: 404 }),
    );
    await page.route(/\/api\/voice/, (route) =>
      route.fulfill({ status: 404 }),
    );
  });

  test("key 8 in demo mode triggers WinConfetti after onboarding", async ({
    page,
  }) => {
    // Enable demo mode via landing so framer-motion and sessionStorage
    // are both initialized correctly (same pattern as beat-6-aha.spec.ts).
    await page.goto("/?demo=true");
    await page
      .getByRole("button", {
        name: /start the fractions lesson with freddy/i,
      })
      .click();
    await expect(page).toHaveURL(/\/lessons\/freddy-fractions/);

    // Greeting bubble auto-dismisses on audio-end — with audio stubbed
    // to 404 in beforeEach, that fires immediately. Wait for the name
    // input instead of racing a manual click against the exit animation.
    const nameInput = page.getByPlaceholder(/type your name/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill("TestKid");
    await page
      .getByRole("button", { name: /send name: testkid/i })
      .click();

    // Key 8 fires React Router navigate('/lesson?beat=win') — no full reload,
    // so Zustand name is preserved and LessonMachineRoot stays alive.
    // The useEffect on LessonMachineRoot sees beat=win and sends WIN_DEMO.
    await page.keyboard.press("8");

    // WinConfetti should be visible.
    await expect(page.getByTestId("win-confetti")).toBeVisible();
  });
});
