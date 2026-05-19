import { expect, test } from "@playwright/test";

/**
 * Smoke test — landing → world → greeting → name → tools active.
 *
 * The lesson view is now a full-bleed world (no separate splash screen
 * or chat panel — see PRD §3.8). The onboarding flow:
 *   1. /lesson loads → RestaurantScene fills the screen, Freddy visible
 *   2. Greeting speech bubble overlays anchored to Freddy
 *   3. Kid taps the bubble (or audio finishes auto-dismiss) → bubble closes
 *   4. NameInputOverlay appears (one-time system keyboard exception)
 *   5. Kid types name + submits → tools become available, onboarding done
 */

test.describe("scaffold happy path", () => {
  test("landing → world → greeting → name → tools active", async ({ page }) => {
    // 1. Landing renders
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /pick a tutor/i }),
    ).toBeVisible();

    // 2. Tap the Freddy CTA → navigate to /lesson
    const cta = page.getByRole("button", {
      name: /learn fractions with freddy/i,
    });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/lesson$/);

    // 3. The world is immediately visible (no separate splash screen)
    await expect(page.getByTestId("restaurant-scene")).toBeVisible();
    await expect(page.getByTestId("freddy-character")).toBeVisible();

    // 4. Greeting speech bubble overlays Freddy
    const bubble = page.getByTestId("speech-bubble");
    await expect(bubble).toBeVisible();
    await expect(bubble).toContainText(/welcome to superslice/i);

    // 5. Tap the bubble to dismiss (skip-ahead pattern)
    await bubble.click();
    await expect(bubble).not.toBeVisible();

    // 6. Name input overlay opens — one-time system keyboard exception
    const overlay = page.getByTestId("name-input-overlay");
    await expect(overlay).toBeVisible();
    const nameInput = page.getByPlaceholder(/type your name/i);
    await expect(nameInput).toBeFocused();

    // 7. Type name + submit
    await nameInput.fill("TestKid");
    await page.getByRole("button", { name: /nice to meet you, testkid/i }).click();

    // 8. Onboarding complete: name input overlay dismisses; world stays clean
    //    (NumberBar + ToolPicker are wired but hidden until XState drives
    //    real input focus / manipulative interaction in a future round).
    await expect(page.getByTestId("name-input-overlay")).not.toBeVisible();
    await expect(page.getByTestId("restaurant-scene")).toBeVisible();
    await expect(page.getByTestId("freddy-character")).toBeVisible();
  });

  test("CTA cards for unbuilt tutors are non-interactive", async ({ page }) => {
    await page.goto("/");
    // The disabled placeholder cards are divs with aria-disabled, not buttons
    const disabledCards = page.locator("[aria-disabled]");
    await expect(disabledCards).toHaveCount(2);
  });
});
