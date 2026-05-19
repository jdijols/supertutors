import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility baseline.
 *
 * Runs axe-core on every reachable route + state and fails on any
 * critical / serious violation. Waves through 'minor' and 'moderate'
 * for v1 — those typically include false positives on Tailwind defaults.
 *
 * Note: we emulate `prefers-reduced-motion: reduce` so Framer Motion
 * skips opacity/transform animations. Otherwise axe samples mid-animation
 * and reports false low-contrast violations for text fading in.
 *
 * Extend this spec when new beats / states are added in P4.
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
  // Tell Framer Motion to skip transitions so axe samples the final-state DOM,
  // not mid-fade opacity values that would trip color-contrast checks falsely.
  await page.emulateMedia({ reducedMotion: "reduce" });
});

/**
 * Wait for Framer Motion entrance animations to settle.
 *
 * Framer Motion reads prefers-reduced-motion at mount time, but components
 * may still cross-fade through low-opacity states on first render. The
 * cheapest reliable fix is a small wait after the page's primary content
 * has rendered. 600ms covers our 400ms transitions with margin.
 */
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
  test("landing has no critical/serious violations", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /pick a tutor/i }),
    ).toBeVisible();
    await waitForAnimationsToSettle(page);
    await expectNoBlockingA11yViolations(page);
  });

  test("splash has no critical/serious violations", async ({ page }) => {
    await page.goto("/lesson");
    await expect(page.getByText(/welcome to superslice/i)).toBeVisible();
    await waitForAnimationsToSettle(page);
    await expectNoBlockingA11yViolations(page);
  });

  test("lesson workspace (post-name) has no critical/serious violations", async ({
    page,
  }) => {
    await page.goto("/lesson");
    await page.getByPlaceholder(/type your name/i).fill("TestKid");
    await page.getByRole("button", { name: /ready to slice/i }).click();
    await expect(page.getByText(/workspace ready/i)).toBeVisible();
    await waitForAnimationsToSettle(page);
    await expectNoBlockingA11yViolations(page);
  });
});
