import type { APIRoute } from "astro";
import { ogCards, ogFile } from "../lib/og-cards";
import { getPosts } from "../lib/posts";

/** Every share card the site links to, for `npm run og` (scripts/og.ts). */
export const GET: APIRoute = async () =>
	new Response(JSON.stringify(ogCards(await getPosts()).map((card) => ({ key: card.key, file: ogFile(card) }))), {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
