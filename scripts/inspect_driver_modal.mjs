import { chromium } from 'playwright';

async function inspectModal() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/logistics/riders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Click first driver row to open modal
  const firstRow = page.locator('.overflow-x-auto div.group').first();
  await firstRow.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/Users/ayobamiolowookere/.gemini/antigravity-ide/brain/52964fbe-40ef-4529-b0e2-464232c9b390/driver_modal_current.png' });
  await browser.close();
}

inspectModal().catch(console.error);
