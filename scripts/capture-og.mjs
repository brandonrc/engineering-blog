// Capture an OG card rendered by /engineering-blog/og-card/[slug] as a PNG
// under public/og/. Run with the dev server up:
//   node scripts/capture-og.mjs [slug] [baseUrl]
import { chromium } from "playwright";

const slug = process.argv[2] ?? "home";
const base = process.argv[3] ?? "http://localhost:4321";

const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1200, height: 630 },
	deviceScaleFactor: 2,
});
await page.goto(`${base}/engineering-blog/og-card/${slug}`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
	path: `public/og/og-${slug}.png`,
	clip: { x: 0, y: 0, width: 1200, height: 630 },
});
await browser.close();
console.log(`captured public/og/og-${slug}.png`);
