import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility baseline.
 *
 * Runs axe-core on every reachable route + state and fails on any
 * critical / serious violation. Waves through 'minor' and 'moderate'
 * (typically Tailwind-default false positives).
 *
 * Note: we emulate `prefers-reduced-motion: reduce` and wait ~600ms after
 * navigation so Framer Motion entrance animations settle before axe
 * samples the DOM (otherwise mid-fade opacity trips false low-contrast).
 */

const BLOCKING_IMPACTS = ["critical", "serious"] as const;

function violationFilter(violations: { impact?: string | null }[]) {
  return violations.filter(
    (v) =>
      v.impact && (BLOCKING_IMPACTS as readonly string[]).includes(v.impact),
  );
}

test.use({ colorScheme: "light" });

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function waitForAnimationsToSettle(page: import("@playwright/test").Page) {
  await page.waitForTimeout(600);
}

async function expectNoBlockingA11yViolations(
  page: import("@playwright/test").Page,
) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = violationFilter(results.violations);
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

test.describe("a11y baseline", () => {
  test("landing page", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /tutors for the ai generation/i }),
    ).toBeVisible();
    await waitForAnimationsToSettle(page);
    await expectNoBlockingA11yViolations(page);
  });

  test("lesson world (onboarding — greeting bubble visible)", async ({
    page,
  }) => {
    await page.goto("/lesson");
    await expect(page.getByTestId("speech-bubble")).toBeVisible();
    await waitForAnimationsToSettle(page);
    await expectNoBlockingA11yViolations(page);
  });

  test("lesson world (onboarding — name input visible)", async ({ page }) => {
    await page.goto("/lesson");
    await page.getByTestId("speech-bubble").click();
    await expect(page.getByTestId("name-input-overlay")).toBeVisible();
    await waitForAnimationsToSettle(page);
    await expectNoBlockingA11yViolations(page);
  });

  test("lesson world (post-onboarding — clean canvas)", async ({ page }) => {
    await page.goto("/lesson");
    await page.getByTestId("speech-bubble").click();
    await page.getByPlaceholder(/type your name/i).fill("TestKid");
    await page
      .getByRole("button", { name: /nice to meet you, testkid/i })
      .click();
    await expect(page.getByTestId("name-input-overlay")).not.toBeVisible();
    await waitForAnimationsToSettle(page);
    await expectNoBlockingA11yViolations(page);
  });

  test("sandbox preview with ToolPicker", async ({ page }) => {
    await page.goto("/preview/sandbox");
    await expect(page.getByTestId("tool-picker")).toBeVisible();
    await waitForAnimationsToSettle(page);
    await expectNoBlockingA11yViolations(page);
  });
});
