import { expect, test } from "@playwright/test";

/**
 * Back-compat redirect: /lesson → /lessons/freddy-fractions.
 * Ensures deep links don't break after the router rewire.
 */
test.describe("back-compat /lesson redirect", () => {
  test("/lesson redirects to /lessons/freddy-fractions and shows the lesson", async ({
    page,
  }) => {
    await page.goto("/lesson");
    await expect(page).toHaveURL(/\/lessons\/freddy-fractions/);
    await expect(page.getByTestId("restaurant-scene")).toBeVisible();
  });

  test("/lesson with query params redirects to /lessons/freddy-fractions (params dropped)", async ({
    page,
  }) => {
    // The redirect Navigate component drops query params. This test
    // verifies the redirect fires and the lesson loads (params are
    // handled by LessonHost at the destination URL).
    await page.goto("/lesson?skip=true");
    // URL becomes /lessons/freddy-fractions (params dropped by Navigate redirect)
    await expect(page).toHaveURL(/\/lessons\/freddy-fractions/);
    await expect(page.getByTestId("restaurant-scene")).toBeVisible();
  });
});
