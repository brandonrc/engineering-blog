import AxeBuilder from "@axe-core/playwright";
import { chromium, type BrowserContext, type Page } from "playwright";
import { afterAll, describe, it } from "vitest";
import { BLOG_PATH } from "../src/lib/blog-path";
import { bylineNames } from "../src/lib/byline";
import { PORT } from "./server";

const ORIGIN = process.env.E2E_ORIGIN ?? `http://localhost:${PORT}`;

// Remote author photos get a 1x1 PNG and Google Fonts an empty stylesheet, so
// pages load without waiting on the internet. The mermaid CDN is let through
// because diagram pages need it.
const PIXEL = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
	"base64",
);

/** Every page reachable from the index by same-site links, read from the HTML. */
async function crawl(): Promise<string[]> {
	const seen = new Set<string>([`${BLOG_PATH}/`]);
	const queue = [`${BLOG_PATH}/`];
	while (queue.length) {
		const html = await (await fetch(ORIGIN + queue.shift()!)).text();
		for (const [, href] of html.matchAll(/<a\s[^>]*href="([^"#]+)/g)) {
			const url = new URL(href, ORIGIN);
			if (url.origin !== ORIGIN || !url.pathname.startsWith(BLOG_PATH)) continue;
			if (/\.(xml|json|png|svg)$/.test(url.pathname)) continue;
			const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
			if (!seen.has(path)) {
				seen.add(path);
				queue.push(path);
			}
		}
	}
	return [...seen].sort();
}

async function newContext(): Promise<BrowserContext> {
	const context = await browser.newContext();
	await context.route(/^https?:\/\//, (route) => {
		const url = new URL(route.request().url());
		if (url.origin === ORIGIN || url.hostname === "cdn.jsdelivr.net") return route.continue();
		if (url.hostname.endsWith("fonts.googleapis.com")) return route.fulfill({ contentType: "text/css", body: "" });
		if (route.request().resourceType() === "image") return route.fulfill({ contentType: "image/png", body: PIXEL });
		return route.fulfill({ body: "" });
	});
	return context;
}

/** Open a page in a fresh context and hand it to `fn`; always clean up. */
async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
	const context = await newContext();
	try {
		return await fn(await context.newPage());
	} finally {
		await context.close();
	}
}

/** Load a page once: lazy images forced in, diagrams given time to draw. */
async function open(page: Page, path: string): Promise<string[]> {
	const problems: string[] = [];
	page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
	page.on("pageerror", (e) => problems.push(`error: ${e.message}`));
	page.on("response", (r) => {
		const url = new URL(r.url());
		if (url.origin !== ORIGIN) return;
		if (!url.pathname.startsWith(BLOG_PATH)) problems.push(`outside ${BLOG_PATH}: ${url.pathname}`);
		if (r.status() >= 400) problems.push(`${r.status()} ${url.pathname}`);
	});
	await page.goto(ORIGIN + path, { waitUntil: "load" });
	await page.evaluate(async () => {
		for (const img of document.querySelectorAll("img")) img.loading = "eager";
		await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
	});
	if (await page.$("code.language-mermaid, .doodle-diagram")) {
		await page.waitForSelector(".doodle-diagram svg", { timeout: 20_000 });
	}
	return problems;
}

/** Everything wrong with one page on desktop and on a phone, from one load. */
async function check(page: Page, path: string): Promise<string[]> {
	const problems = await open(page, path);
	const broken = await page.$$eval("img", (imgs) =>
		imgs.filter((i) => i.naturalWidth === 0).map((i) => i.getAttribute("src")),
	);
	problems.push(...broken.map((src) => `image did not load: ${src}`));

	const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
	for (const v of violations.filter((v) => v.impact === "serious" || v.impact === "critical")) {
		problems.push(`a11y ${v.id} (${v.nodes.length})`);
	}

	await page.setViewportSize({ width: 390, height: 844 });
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
	if (overflow > 0) problems.push(`scrolls sideways on a phone by ${overflow}px`);
	return problems;
}

const browser = await chromium.launch();
const pages = await crawl();
console.log(`testing ${pages.length} pages under ${ORIGIN}${BLOG_PATH}`);

afterAll(() => browser.close());

describe.concurrent("site", () => {
	it("links every post, topic page, author page and the index", ({ expect }) => {
		// index + 18 posts + 4 topics
		expect(pages.length).toBeGreaterThanOrEqual(23);
	});

	it("shows each search suggestion's author photo, name and date", async ({ expect }) => {
		const result = await withPage(async (page) => {
			await open(page, `${BLOG_PATH}/`);
			await page.click("[data-search-trigger]");
			const row = page.locator(".search-result").first();
			await row.waitFor();
			const photo = row.locator("img.sr-avatar");
			return {
				meta: await row.locator(".sr-crumb").innerText(),
				photoLoaded: await photo.evaluate((i: HTMLImageElement) => i.decode().then(() => i.naturalWidth > 0)),
				photoRadius: await photo.evaluate((i) => getComputedStyle(i).borderTopLeftRadius),
			};
		});
		expect(result.photoLoaded).toBe(true);
		expect(result.meta).toMatch(/\w+ \w+ · [A-Z][a-z]{2} \d{1,2}, \d{4}/);
		expect(result.photoRadius).not.toBe("0px");
	});

	it("names every author of a post on its index card", async ({ expect }) => {
		const cards = await withPage(async (page) => {
			await open(page, `${BLOG_PATH}/`);
			return page.$$eval("a:has(.post-byline)", (as) =>
				as.map((a) => ({
					href: (a as HTMLAnchorElement).href,
					byline: a.querySelector(".post-byline")!.textContent!.trim(),
					photos: a.querySelectorAll(".post-byline-faces > *").length,
				})),
			);
		});
		const mismatches: string[] = [];
		for (const card of cards) {
			// Author links are in the server-rendered HTML; no browser needed.
			const html = await (await fetch(card.href)).text();
			const header = html.slice(html.indexOf("<header"), html.indexOf("</header>", html.indexOf("<article")));
			const names = [...header.matchAll(/href="[^"]*\/author\/[^"]*"[^>]*>[\s\S]*?font-semibold[^>]*>([^<]+)</g)].map(
				([, name]) => ({ name: name.trim() }),
			);
			if (card.byline !== bylineNames(names) || card.photos !== Math.max(names.length, 1)) {
				mismatches.push(`${card.href}: "${card.byline}" with ${card.photos} photos, page lists ${names.length}`);
			}
		}
		expect(cards.length).toBeGreaterThan(0);
		expect(mismatches).toEqual([]);
	});

	it("renders backtick code in a title as code on its card, post page and in search", async ({ expect }) => {
		const result = await withPage(async (page) => {
			await open(page, `${BLOG_PATH}/`);
			const titles = page.locator("a:has(.post-byline) :is(h2, h3)");
			const rawBackticks = (await titles.allInnerTexts()).filter((t) => t.includes("`"));
			const card = page.locator("a:has(.post-byline):has(.title-code)").first();
			const code = await card.locator(".title-code").first().innerText();
			const href = await card.getAttribute("href");
			await page.click("[data-search-trigger]");
			await page.fill("[data-search-input]", code);
			const searchCode = await page.locator(".search-result .sr-title .title-code").first().innerText();
			await open(page, href!);
			return {
				rawBackticks,
				code,
				searchCode,
				pageCode: await page.locator("article h1 .title-code").first().innerText(),
				tabTitle: await page.title(),
			};
		});
		expect(result.rawBackticks).toEqual([]);
		expect(result.pageCode).toBe(result.code);
		expect(result.searchCode.toLowerCase()).toContain(result.code.toLowerCase());
		expect(result.tabTitle).toContain(result.code);
		expect(result.tabTitle).not.toContain("`");
	});

	it("opens a diagram full screen on click or Enter, and closes it on Escape", async ({ expect }) => {
		let diagramPage: string | undefined;
		for (const path of pages) {
			if ((await (await fetch(ORIGIN + path)).text()).includes("language-mermaid")) {
				diagramPage = path;
				break;
			}
		}
		expect(diagramPage).toBeDefined();
		const result = await withPage(async (page) => {
			await open(page, diagramPage!);
			const diagram = page.locator(".doodle-wrap").first();
			const inline = (await diagram.locator("svg").first().boundingBox())!;
			const dialog = page.locator("dialog.diagram-zoom");
			await diagram.click();
			const zoomed = (await dialog.locator("svg").first().boundingBox())!;
			const openAfterClick = await dialog.evaluate((d: HTMLDialogElement) => d.open);
			const zoomedVisible = await dialog.locator("svg").first().isVisible();
			const zoomedVisibility = await dialog.locator("svg").first().evaluate((s) => getComputedStyle(s).visibility);
			await page.keyboard.press("Escape");
			const openAfterEscape = await dialog.evaluate((d: HTMLDialogElement) => d.open);
			await diagram.focus();
			await page.keyboard.press("Enter");
			const openAfterEnter = await dialog.evaluate((d: HTMLDialogElement) => d.open);
			return { inline, zoomed, openAfterClick, zoomedVisible, zoomedVisibility, openAfterEscape, openAfterEnter };
		});
		expect(result.openAfterClick).toBe(true);
		expect(result.zoomedVisible).toBe(true);
		expect(result.zoomedVisibility).toBe("visible");
		expect(result.zoomed.width * result.zoomed.height).toBeGreaterThan(result.inline.width * result.inline.height);
		expect(result.openAfterEscape).toBe(false);
		expect(result.openAfterEnter).toBe(true);
	});
});

describe.concurrent("pages", () => {
	for (const path of pages) {
		it(`${path} loads cleanly, fits a phone, has no serious a11y issues`, async ({ expect }) => {
			expect(await withPage((page) => check(page, path))).toEqual([]);
		});
	}
});
