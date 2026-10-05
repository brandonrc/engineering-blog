// Deploy dist/ to the Worker and point openteams.com<BLOG_PATH> at it, along
// with the old addresses of posts that moved here (the build wrote their
// redirects to dist/_redirects). `wrangler deploy` with routes replaces every
// route on the Worker, so routes not listed here are removed.
//
//   node scripts/deploy.ts            production
//   node scripts/deploy.ts pr-12      preview version, routes untouched
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { BLOG_PATH } from "../src/lib/blog-path.ts";
import { oldRoutes, postMoves } from "../src/lib/old-addresses.ts";

const HOST = "openteams.com";

if (!existsSync(`dist${BLOG_PATH}/index.html`)) {
	throw new Error(`dist${BLOG_PATH}/index.html missing: run npm run build first`);
}

const alias = process.argv[2];
const routes = [`${HOST}${BLOG_PATH}`, `${HOST}${BLOG_PATH}/*`, ...oldRoutes(HOST, postMoves())];
const args = alias
	? ["versions", "upload", "--preview-alias", alias]
	: ["deploy", ...routes.flatMap((route) => ["--route", route])];

execFileSync("npx", ["wrangler", ...args], { stdio: "inherit" });
