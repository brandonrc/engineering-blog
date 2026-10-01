import AxeBuilder from "@axe-core/playwright";
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, describe, expect, it } from "vitest";
import { BLOG_PATH } from "../src/lib/blog-path";
import { bylineNames } from "../src/lib/byline";
import { PORT } from "./server";

const ORIGIN = process.env.E2E_ORIGIN ?? `http://localhost:${PORT}`;
let browser: Browser;
let pages: string[] = [];

/** Every page reachable from the index by same-site links. */
async function crawl(page: Page): Promise<string[]> {
	const seen = new Set<string>([`${BLOG_PATH}/`]);
	const queue = [`${BLOG_PATH}/`];
	while (queue.length) {
		const path = queue.shift()!;
		await page.goto(ORIGIN + path);
		const links = await page.$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).href));
		for (const href of links) {
			const url = new URL(href);
			if (url.origin !== ORIGIN || !url.pathname.startsWith(BLOG_PATH)) continue;
			if (/\.(xml|json|png|svg)$/.test(url.pathname)) continue;
			const p = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
			if (!seen.has(p)) {
				seen.add(p);
				queue.push(p);
			}
		}
	}
	return [...seen].sort();
}

/** Load a page fully: lazy images forced in, diagrams given time to draw. */
async function open(page: Page, path: string) {
	const problems: string[] = [];
	page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
	page.on("pageerror", (e) => problems.push(`error: ${e.message}`));
	page.on("response", (r) => {
		const url = new URL(r.url());
		if (url.origin === ORIGIN && !url.pathname.startsWith(BLOG_PATH)) problems.push(`outside ${BLOG_PATH}: ${url.pathname}`);
		if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`);
	});
	await page.goto(ORIGIN + path, { waitUntil: "networkidle" });
	await page.evaluate(async () => {
		for (const img of document.querySelectorAll("img")) img.loading = "eager";
		await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
	});
	if (await page.$("code.language-mermaid, .doodle-diagram")) {
		await page.waitForSelector(".doodle-diagram svg", { timeout: 30_000 });
	}
	return problems;
}

// Crawl once at collection time so every page becomes its own test and the
// verbose reporter prints each result as it finishes.
browser = await chromium.launch();
{
	const page = await browser.newPage();
	pages = await crawl(page);
	await page.close();
}
console.log(`testing ${pages.length} pages under ${ORIGIN}${BLOG_PATH}`);

afterAll(() => browser?.close());

describe("site", () => {
	it("links every post, topic page and the index", () => {
		// index + 18 posts + 4 topics
		expect(pages.length).toBeGreaterThanOrEqual(23);
	});

	it("shows each search suggestion's author photo, name and date", async () => {
		const page = await browser.newPage();
		await open(page, `${BLOG_PATH}/`);
		await page.click("[data-search-trigger]");
		const row = page.locator(".search-result").first();
		await row.waitFor();
		const photo = row.locator("img.sr-avatar");
		const meta = await row.locator(".sr-crumb").innerText();
		const photoLoaded = await photo.evaluate((i: HTMLImageElement) => i.decode().then(() => i.naturalWidth > 0));
		const photoRadius = await photo.evaluate((i) => getComputedStyle(i).borderTopLeftRadius);
		await page.close();
		expect(photoLoaded).toBe(true);
		expect(meta).toMatch(/\w+ \w+ · [A-Z][a-z]{2} \d{1,2}, \d{4}/);
		expect(photoRadius).not.toBe("0px");
	});

	it("names every author of a post on its index card", async () => {
		const page = await browser.newPage();
		await open(page, `${BLOG_PATH}/`);
		const cards = await page.$$eval("a:has(.post-byline)", (as) =>
			as.map((a) => ({
				href: (a as HTMLAnchorElement).href,
				byline: a.querySelector(".post-byline")!.textContent!.trim(),
				photos: a.querySelectorAll(".post-byline-faces > *").length,
			})),
		);
		const mismatches: string[] = [];
		for (const card of cards) {
			await page.goto(card.href);
			const names = await page.$$eval('article header a[href*="/author/"]', (as) =>
				as.map((a) => ({ name: (a as HTMLElement).innerText.split("\n")[0].trim() })),
			);
			if (card.byline !== bylineNames(names) || card.photos !== Math.max(names.length, 1)) {
				mismatches.push(`${card.href}: "${card.byline}" with ${card.photos} photos, page lists ${names.length}`);
			}
		}
		await page.close();
		expect(cards.length).toBeGreaterThan(0);
		expect(mismatches).toEqual([]);
	});
});

describe.each(pages)("%s", (path) => {
	it("loads with no errors, broken files, or requests outside BLOG_PATH", async () => {
		const page = await browser.newPage();
		const problems = await open(page, path);
		const broken = await page.$$eval("img", (imgs) =>
			imgs.filter((i) => i.naturalWidth === 0).map((i) => i.getAttribute("src")),
		);
		problems.push(...broken.map((src) => `image did not load: ${src}`));
		await page.close();
		expect(problems).toEqual([]);
	});

	it("does not scroll sideways on a phone", async () => {
		const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
		await open(page, path);
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
		await page.close();
		expect(overflow).toBeLessThanOrEqual(0);
	});

	it("has no serious accessibility problems", async () => {
		const context = await browser.newContext();
		const page = await context.newPage();
		await open(page, path);
		const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
		await context.close();
		const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
		expect(serious.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
	});
});
