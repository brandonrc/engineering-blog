export interface Author {
	slug: string;
	name: string;
	bio: string;
	avatarUrl: string | null;
}

/**
 * Read the content repo's authors.yml (a flat list under `authors:`).
 * Only public profile fields are kept: the registry also carries work
 * emails, which must not land in this repo.
 */
export function parseAuthors(yml: string): Author[] {
	return yml
		.split(/\n  - /)
		.slice(1)
		.map((entry) => {
			const field = (key: string): string => {
				const m = entry.match(new RegExp(`(?:^|\\n)\\s*${key}:\\s*(>-)?\\s*([^\\n]*(?:\\n\\s{6,}[^\\n]+)*)`));
				return m ? m[2].replace(/\n\s+/g, " ").trim() : "";
			};
			return {
				slug: field("slug"),
				name: field("name"),
				bio: field("bio"),
				avatarUrl: field("avatar_url") || null,
			};
		})
		.filter((a) => a.slug);
}
