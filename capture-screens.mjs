import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';

const URL = 'http://localhost:5173';
const OUTPUT = '.stitch';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Capture each tab using force click to bypass overlay interception
  const tabConfigs = [
    { name: 'brainstorm', onboarding: 'brainstorm-tab' },
    { name: 'mindmap', onboarding: 'mindmap-tab' },
    { name: 'screenplay', onboarding: 'screenplay-tab' },
    { name: 'encyclopedia', onboarding: 'encyclopedia-tab' },
  ];

  for (const tab of tabConfigs) {
    // Click tab via evaluate (bypasses overlay interception)
    await page.evaluate((onboarding) => {
      const btn = document.querySelector(`[data-onboarding="${onboarding}"]`);
      if (btn) btn.click();
    }, tab.onboarding);
    
    await page.waitForTimeout(2000);

    // Get full rendered HTML
    const html = await page.content();
    writeFileSync(`${OUTPUT}/app-${tab.name}.html`, html);
    console.log(`Saved app-${tab.name}.html (${html.length} bytes)`);

    // Take screenshot
    await page.screenshot({ path: `${OUTPUT}/screenshot-${tab.name}.png`, fullPage: false });
    console.log(`Saved screenshot-${tab.name}.png`);

    // Verify which tab is active
    const activeText = await page.evaluate(() => {
      const active = document.querySelector('.nav-item.active');
      return active ? active.textContent.trim() : 'none';
    });
    console.log(`  Active tab: ${activeText}`);
  }

  await browser.close();
  console.log('\nDone!');
}

capture().catch(err => { console.error(err); process.exit(1); });
