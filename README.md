<p align="center">
  <img src="https://openteams.com/engineering-blog/og/og-home.png" alt="OpenTeams Engineering Blog" width="720">
</p>

<p align="center">
  <a href="https://github.com/openteams-ai/engineering-blog-v2/actions/workflows/ci.yml"><img src="https://github.com/openteams-ai/engineering-blog-v2/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/openteams-ai/engineering-blog-v2/actions/workflows/deploy.yml"><img src="https://github.com/openteams-ai/engineering-blog-v2/actions/workflows/deploy.yml/badge.svg?branch=main" alt="Deploy"></a>
</p>

## Develop

```bash
npm install
npm run dev          # http://localhost:4321/engineering-blog
npm run build
npm run og           # share cards into dist/ (needed before test:e2e)
npm test             # unit tests
npm run test:e2e     # browser tests against the build
```

## Write a post

1. New author? Add them to `src/data/authors.json` (slug, name, bio, photo URL).
2. Add `src/content/posts/<name>.md`:

   ```yaml
   ---
   title: My Post
   slug: my-post
   date: 2026-10-01
   updated: 2026-10-05   # optional: set it when you edit a published post
   authors:
     - author-slug        # from src/data/authors.json
   categories:
     - Engineering
   meta_description: One sentence for search and link previews.
   ---
   ```

   Images go in `src/content/posts/images/`.

3. Add its topic in `src/data/topics.ts`.
4. Draw its card art in `src/components/PostArt.astro` and list it in `BlogThumb.astro`.

Share images (the card shown in link previews) are made on deploy: one for the
blog, each post and each author (`src/lib/og-cards.ts`, drawn by
`src/pages/og-card/[slug].astro`). Each file is named by a fingerprint of what
is on the card, so `npm run og` downloads the ones the live site already has
and renders only new or changed ones, such as a new post, a new author, or an
author whose post count changed.

## Deploy

| Event | Result |
| --- | --- |
| Pull request | Preview link posted on the PR |
| Merge to `main` | Live on openteams.com |

Every build also writes `sitemap.xml` and keeps old addresses working: a post
that moved here from the main site has its old address in `wordpress_url` in
its frontmatter, and that address redirects to the post
(`src/lib/old-addresses.ts`).
