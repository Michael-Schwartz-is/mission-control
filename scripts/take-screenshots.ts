/**
 * Screenshot tool for README documentation.
 * Uses persistent browser context so you can log in once.
 *
 * Usage: npx tsx scripts/take-screenshots.ts
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5555';
const SCREENSHOT_DIR = 'docs/screenshots';

async function takeScreenshots() {
  const userDataDir = '/tmp/mc-screenshots-browser';
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('Navigating to Mission Control...');
  await page.goto(BASE_URL);
  await page.waitForTimeout(3000);

  const isLoggedIn = await page.locator('text=Board').count() > 0;

  if (!isLoggedIn) {
    console.log('\n⚠️  Not logged in. Please sign in with Google in the browser window.');
    await page.waitForSelector('text=Board', { timeout: 120000 });
    await page.waitForTimeout(2000);
  }

  console.log('✓ Authenticated. Taking screenshots...');

  // Board tab
  const boardTab = page.locator('text=Board').first();
  if (await boardTab.count() > 0) {
    await boardTab.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({
    path: `${SCREENSHOT_DIR}/board.png`,
    fullPage: false,
  });
  console.log(`✓ Saved ${SCREENSHOT_DIR}/board.png`);

  // Details tab
  const detailsTab = page.locator('text=Details').first();
  if (await detailsTab.count() > 0) {
    await detailsTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/details.png`,
      fullPage: false,
    });
    console.log(`✓ Saved ${SCREENSHOT_DIR}/details.png`);
  }

  console.log('\n✓ All screenshots saved to docs/screenshots/');
  await context.close();
}

takeScreenshots().catch(console.error);
