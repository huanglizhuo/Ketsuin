import { chromium } from 'playwright';

const URL = 'https://ketsuin.clothpath.com/';
const OUTPUT_DIR = '/Users/lizhuo/owork/ketsuin/screenshots';

const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

async function capture() {
  const browser = await chromium.launch();

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
    });

    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(new Error('camera blocked for screenshot'));
    });

    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: `${OUTPUT_DIR}/${vp.name}_atf.png`, fullPage: false });
    await page.screenshot({ path: `${OUTPUT_DIR}/${vp.name}_full.png`, fullPage: true });

    console.log(`Captured ${vp.name} (${vp.width}x${vp.height})`);
    await page.close();
  }

  // No-JS version
  const pageNoJs = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    javaScriptEnabled: false,
  });
  await pageNoJs.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await pageNoJs.screenshot({ path: `${OUTPUT_DIR}/nojs_desktop.png`, fullPage: false });
  console.log('Captured no-JS version');
  await pageNoJs.close();

  await browser.close();
  console.log('All screenshots captured.');
}

capture().catch(console.error);
