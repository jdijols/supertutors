import { expect, test } from "@playwright/test";

/**
 * Registry routing — contract test for the lesson-server platform.
 *
 * Every lesson in the registry is reachable via /lessons/:slug. The
 * landing surfaces them all as poster cards (signed-out variant).
 *
 * If a new lesson is added to src/platform/registry.ts and this spec
 * doesn't need updating, the platform is doing its job (registration
 * → routing with no extra wiring).
 */

test.describe("lesson registry", () => {
  test("landing renders all three lesson poster cards", async ({ page }) => {
    await page.goto("/");

    // Freddy hero — accessible name kept stable across redesigns.
    await expect(
      page.getByRole("button", {
        name: /start the fractions lesson with freddy/i,
      }),
    ).toBeVisible();

    // ASL with Sage
    await expect(
      page.getByRole("button", { name: /start the asl lesson with sage/i }),
    ).toBeVisible();

    // Acutis (Theology with Carlo)
    await expect(
      page.getByRole("button", { name: /preview the theology lesson with carlo/i }),
    ).toBeVisible();
  });

  test("/lessons/freddy-fractions loads the Freddy world", async ({ page }) => {
    await page.goto("/lessons/freddy-fractions");
    await expect(page).toHaveURL(/\/lessons\/freddy-fractions$/);
    await expect(page.getByTestId("restaurant-scene")).toBeVisible();
  });

  test("/lessons/acutis loads the Acutis coming-soon card", async ({ page }) => {
    await page.goto("/lessons/acutis");
    await expect(page).toHaveURL(/\/lessons\/acutis$/);
    // Acutis still uses ComingSoonMount.
    await expect(
      page.getByRole("heading", { name: "Classical Studies" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
  });

  test("/lessons/asl loads the ASL lesson (camera-gated)", async ({ page }) => {
    // ASL now mounts a real practice screen behind a camera permission gate.
    // In headless Playwright without camera, HandTracker reports 'error' →
    // CameraGate renders. We assert that we reach the lesson route (not
    // a 404) and that the camera-gate copy appears.
    await page.goto("/lessons/asl");
    await expect(page).toHaveURL(/\/lessons\/asl$/);
    // Either the camera gate or the practice screen is acceptable here;
    // both prove the route + Mount works. We assert at least one signal:
    const cameraGate = page.getByRole("heading", { name: /camera access/i });
    const practiceScreenSignal = page.locator(
      'video[autoplay][muted][playsinline]',
    );
    await expect(cameraGate.or(practiceScreenSignal).first()).toBeVisible();
  });

  test("/lessons/<unknown-slug> shows the not-found state", async ({ page }) => {
    await page.goto("/lessons/this-lesson-does-not-exist");
    await expect(page.getByText(/lesson not found/i)).toBeVisible();
    await expect(
      page.getByText(/no lesson registered for "this-lesson-does-not-exist"/i),
    ).toBeVisible();
    await page.getByRole("button", { name: /back to home/i }).click();
    await expect(page).toHaveURL("/");
  });
});
