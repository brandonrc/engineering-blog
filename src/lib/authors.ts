import type { Author } from "./posts";

/** Authors with at least one post, with their posts in the order given. */
export function authorsOf<P extends { authors: Author[] }>(posts: P[]): { author: Author; posts: P[] }[] {
	const byAuthor = new Map<string, { author: Author; posts: P[] }>();
	for (const post of posts) {
		for (const author of post.authors) {
			const entry = byAuthor.get(author.slug) ?? { author, posts: [] };
			entry.posts.push(post);
			byAuthor.set(author.slug, entry);
		}
	}
	return [...byAuthor.values()];
}
