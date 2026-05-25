import { expect, test } from "@playwright/test";

/**
 * Smoke test — signed-out landing renders, sign-in flow opens.
 *
 * Signed-out behavior: bento grid with 4 cards. Clicking any lesson card
 * opens the SignInDialog (since lessons require auth for progress tracking).
 *
 * The full Freddy lesson happy path still works at /lessons/freddy-fractions
 * when navigating directly — see the second test below.
 */

test.describe("scaffold happy path", () => {
  test("landing → sign-in dialog opens on lesson click", async ({ page }) => {
    await page.goto("/");

    // About card renders the colophon headline
    await expect(
      page.getByRole("heading", { name: /tutors for the ai generation/i }),
    ).toBeVisible();

    // Freddy CTA is still present
    const cta = page.getByRole("button", {
      name: /start the fractions lesson with freddy/i,
    });
    await expect(cta).toBeVisible();

    // Click → opens SignInDialog (not navigation, since we're signed-out)
    await cta.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
  });

  test("direct /lessons/freddy-fractions still loads the world", async ({
    page,
  }) => {
    // Direct navigation bypasses the auth gate — lesson still mounts,
    // platform.progress will be undefined (no progress writes), but
    // the world renders.
    await page.goto("/lessons/freddy-fractions");
    await expect(page.getByTestId("restaurant-scene")).toBeVisible();
    await expect(page.getByTestId("freddy-character")).toBeVisible();

    // Greeting bubble shows
    const bubble = page.getByTestId("speech-bubble");
    await expect(bubble).toBeVisible();
    await expect(bubble).toContainText(/welcome to superslice/i);

    // Tap dismisses
    await bubble.click();
    await expect(bubble).not.toBeVisible();

    // Name input overlay appears
    const overlay = page.getByTestId("name-input-overlay");
    await expect(overlay).toBeVisible();
  });
});
