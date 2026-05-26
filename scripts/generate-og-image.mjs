#!/usr/bin/env node
/**
 * generate-og-image.mjs — rasterizes the BrainliftCard at 1200×630 into
 * public/og-image.png for use as the site's og:image / twitter:image.
 *
 * Usage:
 *   1. Start the dev server: `npm run dev` (default port 5173)
 *   2. In another shell: `npm run og:generate`
 *
 * Reads OG_DEV_URL env var to override the dev server URL (default
 * http://localhost:5173). Uses Playwright (already a project dep) so no
 * extra install.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(REPO_ROOT, "public", "og-image.png");
const DEV_URL = process.env.OG_DEV_URL ?? "http://localhost:5173";
const TARGET_URL = `${DEV_URL}/og-image`;

async function main() {
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    console.log(`→ navigating to ${TARGET_URL}`);
    const response = await page.goto(TARGET_URL, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    if (!response || !response.ok()) {
      throw new Error(
        `dev server not responding at ${TARGET_URL} (status ${response?.status() ?? "no response"}). Is \`npm run dev\` running?`,
      );
    }

    // Wait for the Carlo portrait to fully load — the gradient looks wrong without it.
    await page.waitForSelector('img[src*="carlo-acutis"]', { state: "visible" });
    await page.waitForLoadState("networkidle");
    // Tiny settle pause for web fonts and framer-motion initial render.
    await page.waitForTimeout(400);

    await page.screenshot({
      path: OUTPUT_PATH,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
      type: "png",
      omitBackground: false,
    });
    console.log(`✓ wrote ${path.relative(REPO_ROOT, OUTPUT_PATH)} (1200×630 @2x)`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("✗ generate-og-image failed:", err.message);
  process.exit(1);
});
