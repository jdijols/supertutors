import { expect, test } from "@playwright/test";

/**
 * CV sandbox smoke — verifies the hand-tracking toggle and privacy gate
 * work without requiring a real webcam. CI cannot grant camera permissions
 * so we only test up to the privacy notice dialog; the rest is covered by
 * manual PT.4 device inspection and the README recording notes.
 */
test.describe("CV sandbox", () => {
  test("hand-tracking toggle appears in sandbox and shows privacy notice", async ({
    page,
  }) => {
    await page.goto("/lesson?skip=true");
    await expect(page.getByTestId("tool-picker")).toBeVisible();

    // CV toggle button is present.
    const cvBtn = page.getByRole("button", {
      name: /hand tracking \(cv mode\)/i,
    });
    await expect(cvBtn).toBeVisible();

    // Clicking opens the camera permission dialog.
    await cvBtn.click();
    const dialog = page.getByRole("dialog", {
      name: /camera permission notice/i,
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/no video is recorded or sent/i);
    await expect(
      page.getByRole("button", { name: /got it/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /no thanks/i }),
    ).toBeVisible();
  });

  test("?cv=true URL param opens privacy notice directly", async ({ page }) => {
    await page.goto("/lesson?skip=true&cv=true");
    const dialog = page.getByRole("dialog", {
      name: /camera permission notice/i,
    });
    await expect(dialog).toBeVisible();
  });

  test("declining privacy notice dismisses CV mode", async ({ page }) => {
    await page.goto("/lesson?skip=true&cv=true");
    await page.getByRole("button", { name: /no thanks/i }).click();
    // Dialog goes away and URL loses ?cv param.
    await expect(
      page.getByRole("dialog", { name: /camera permission notice/i }),
    ).not.toBeVisible();
    await expect(page).toHaveURL(/\/lesson(?!.*\bcv=true)/);
  });
});
