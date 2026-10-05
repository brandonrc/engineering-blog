import type { APIRoute } from "astro";
import { pageUrl } from "../lib/blog-path";
import { authorsOf, getPosts, topicsOf } from "../lib/posts";

/** Every page of the blog, for search engines: the index, posts, topics and authors. */
export const GET: APIRoute = async ({ site }) => {
	const posts = await getPosts();
	const paths = [
		pageUrl(),
		...posts.map((post) => pageUrl(`/${post.slug}`)),
		...topicsOf(posts).map((topic) => pageUrl(`/tag/${topic.slug}`)),
		...authorsOf(posts).map(({ author }) => pageUrl(`/author/${author.slug}`)),
	];
	const urls = paths.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join("\n");

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
		{ headers: { "Content-Type": "application/xml; charset=utf-8" } },
	);
};
