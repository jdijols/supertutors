import { expect, test } from "@playwright/test";

/**
 * Smoke test — landing → splash → workspace.
 *
 * Covers the only path the user can take through the scaffolded shell.
 * Future phases (P1–P4) extend this with beat-specific assertions.
 */

test.describe("scaffold happy path", () => {
  test("landing → CTA → splash → name → workspace", async ({ page }) => {
    // 1. Landing renders
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /pick a tutor/i }),
    ).toBeVisible();

    // 2. Active Freddy CTA card is the only enabled tutor; tap navigates
    const cta = page.getByRole("button", {
      name: /learn fractions with freddy/i,
    });
    await expect(cta).toBeVisible();
    await cta.click();

    // 3. Splash renders with name input
    await expect(page).toHaveURL(/\/lesson$/);
    await expect(page.getByText(/welcome to superslice/i)).toBeVisible();
    const nameInput = page.getByPlaceholder(/type your name/i);
    await expect(nameInput).toBeFocused();

    // 4. Submit advances to workspace
    await nameInput.fill("TestKid");
    await page.getByRole("button", { name: /ready to slice/i }).click();

    // 5. Workspace renders with the name personalized
    await expect(page.getByText(/workspace ready, testkid/i)).toBeVisible();
  });

  test("CTA cards for unbuilt tutors are non-interactive", async ({ page }) => {
    await page.goto("/");
    // The disabled placeholder cards are divs with aria-disabled, not buttons
    const disabledCards = page.locator("[aria-disabled]");
    await expect(disabledCards).toHaveCount(2);
  });
});
