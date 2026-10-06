// Structured data (schema.org, as JSON-LD) that tells search engines what a
// page is. The organization and site entries repeat the ids and names the
// main site publishes for itself, so both describe one organization and one
// site rather than two.
const MAIN_SITE = "https://openteams.com";
const ORGANIZATION = { "@id": `${MAIN_SITE}/#schema-publishing-organization` };
const WEBSITE = { "@id": `${MAIN_SITE}/#schema-website` };

export interface SchemaPage {
	/** The page's canonical address. */
	url: string;
	/** Set on a post: what it says, when it came out, who wrote it. */
	article?: {
		title: string;
		description: string;
		published: Date;
		/** The share image, as an absolute address. */
		image: string;
		authors: { name: string; bio: string; url: string; sameAs: string[] }[];
	};
}

// Share images are drawn at this size (scripts/og.ts: 1200 x 630 at double density).
const SHARE_IMAGE = { width: 2400, height: 1260 };

/** The structured data for one page, ready to serialise into the page. */
export function pageSchema(page: SchemaPage): object {
	const webPage = { "@id": `${page.url}#schema-webpage` };
	const { article } = page;
	const authors = (article?.authors ?? []).map((author) => ({
		"@type": "Person",
		"@id": `${author.url}#schema-author`,
		name: author.name,
		url: author.url,
		description: author.bio,
		...(author.sameAs.length && { sameAs: author.sameAs }),
	}));
	return {
		"@context": "https://schema.org",
		"@graph": [
			{ "@type": "Organization", ...ORGANIZATION, url: MAIN_SITE, name: "OpenTeams | AI you own" },
			{
				"@type": "WebSite",
				...WEBSITE,
				url: MAIN_SITE,
				name: "OpenTeams: Open SaaS AI Solutions | Own Your Future with Open Source",
				potentialAction: {
					"@type": "SearchAction",
					target: `${MAIN_SITE}/search/{search_term_string}/`,
					"query-input": "required name=search_term_string",
				},
			},
			{ "@type": "WebPage", ...webPage, isPartOf: WEBSITE, publisher: ORGANIZATION, url: page.url },
			...authors,
			...(article
				? [
						{
							"@type": "Article",
							mainEntityOfPage: webPage,
							publisher: ORGANIZATION,
							datePublished: article.published.toISOString(),
							headline: article.title,
							description: article.description,
							author: authors.map((author) => ({ "@id": author["@id"] })),
							image: { "@type": "ImageObject", "@id": `${page.url}#schema-article-image`, url: article.image, ...SHARE_IMAGE },
							thumbnailUrl: article.image,
						},
					]
				: []),
		],
	};
}
