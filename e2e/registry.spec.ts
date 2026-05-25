import { expect, test } from "@playwright/test";

/**
 * Registry routing: every lesson in the registry is reachable via
 * /lessons/:slug, and the landing page surfaces them all. Catches the
 * "registered but unreachable" and "removed but still linked" classes
 * of bug as the registry grows.
 *
 * This is the contract test for the lesson-server platform: if a new
 * lesson is added to src/platform/registry.ts and this spec doesn't
 * need updating, the platform is doing its job (registration → routing
 * with no extra wiring).
 */

test.describe("lesson registry", () => {
  test("landing page links every coming-soon lesson + the Freddy hero card", async ({
    page,
  }) => {
    await page.goto("/");

    // Freddy is the hero — the FreddyPosterCard has the accessible name
    // 'Start the fractions lesson with Freddy' (kept stable for legacy
    // smoke spec compat).
    await expect(
      page.getByRole("button", {
        name: /start the fractions lesson with freddy/i,
      }),
    ).toBeVisible();

    // Coming-soon pills render the subject of every non-Freddy lesson.
    // We assert the two stub lessons by their subjects.
    await expect(
      page.getByRole("button", { name: "Classical Studies" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign Language" }),
    ).toBeVisible();
  });

  test("/lessons/freddy-fractions loads the Freddy lesson", async ({ page }) => {
    await page.goto("/lessons/freddy-fractions");
    await expect(page).toHaveURL(/\/lessons\/freddy-fractions$/);
    await expect(page.getByTestId("restaurant-scene")).toBeVisible();
  });

  test("/lessons/acutis loads the Acutis coming-soon card", async ({ page }) => {
    await page.goto("/lessons/acutis");
    await expect(page).toHaveURL(/\/lessons\/acutis$/);
    // ComingSoonMount renders subject as the h1.
    await expect(
      page.getByRole("heading", { name: "Classical Studies" }),
    ).toBeVisible();
    // Plus the back button — proves the platform's onComplete handle is
    // wired up (clicking should navigate to /).
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
  });

  test("/lessons/asl loads the ASL coming-soon card", async ({ page }) => {
    await page.goto("/lessons/asl");
    await expect(page).toHaveURL(/\/lessons\/asl$/);
    await expect(
      page.getByRole("heading", { name: "Sign Language" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
  });

  test("/lessons/<unknown-slug> shows the not-found state", async ({ page }) => {
    await page.goto("/lessons/this-lesson-does-not-exist");
    await expect(
      page.getByText(/lesson not found/i),
    ).toBeVisible();
    await expect(
      page.getByText(/no lesson registered for "this-lesson-does-not-exist"/i),
    ).toBeVisible();
    // The Back-to-home button returns to the landing page.
    await page.getByRole("button", { name: /back to home/i }).click();
    await expect(page).toHaveURL("/");
  });
});
