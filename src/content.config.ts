import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Posts are byte-for-byte copies of the engineering-blog content repo
// (scripts/sync-posts.ts). The frontmatter `slug` becomes the entry id.
const posts = defineCollection({
	loader: glob({ pattern: "*.md", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		authors: z.array(z.string()).default([]),
		categories: z.array(z.string()).default([]),
		meta_description: z.string().default(""),
	}),
});

export const collections = { posts };
