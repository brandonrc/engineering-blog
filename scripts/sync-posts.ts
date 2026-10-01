/**
 * Copy the engineering-blog content repo into this site.
 *
 *   node scripts/sync-posts.ts [path-to-engineering-blog]
 *
 * - posts/*.md and posts/images/** are copied byte for byte into
 *   src/content/posts/.
 * - authors.yml becomes src/data/authors.json with public profile fields
 *   only (no emails).
 * - Each post's publication date is its file's first commit in the content
 *   repo, written to src/data/published-dates.json keyed by post slug.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseAuthors } from "../src/lib/authors.ts";

const SRC = resolve(process.argv[2] ?? "../engineering-blog");
const POSTS = join(SRC, "posts");
const DEST = resolve("src/content/posts");

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });
cpSync(join(POSTS, "images"), join(DEST, "images"), { recursive: true });

const dates: Record<string, string> = {};
const files = readdirSync(POSTS).filter((f) => f.endsWith(".md"));
for (const file of files) {
	const raw = readFileSync(join(POSTS, file), "utf8");
	writeFileSync(join(DEST, file), raw);
	const slug = /^slug:\s*['"]?([^'"\n]+)/m.exec(raw)?.[1].trim();
	const first = execFileSync(
		"git",
		["-C", SRC, "log", "--follow", "--format=%aI", "--reverse", "--", join("posts", file)],
		{ encoding: "utf8" },
	)
		.split("\n")[0]
		.trim();
	if (slug && first) dates[slug] = first;
}

const sorted = Object.fromEntries(Object.entries(dates).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync("src/data/published-dates.json", JSON.stringify(sorted, null, "\t") + "\n");
writeFileSync(
	"src/data/authors.json",
	JSON.stringify(parseAuthors(readFileSync(join(SRC, "authors.yml"), "utf8")), null, "\t") + "\n",
);
console.log(`synced ${files.length} posts from ${SRC}`);
