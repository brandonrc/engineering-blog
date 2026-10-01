<p align="center">
  <img src="https://openteams.com/sandbox-4af53e-engineering-blog/og/og-home.png" alt="OpenTeams Engineering Blog" width="720">
</p>

<p align="center">
  <a href="https://github.com/openteams-ai/engineering-blog-v2/actions/workflows/ci.yml"><img src="https://github.com/openteams-ai/engineering-blog-v2/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/openteams-ai/engineering-blog-v2/actions/workflows/deploy.yml"><img src="https://github.com/openteams-ai/engineering-blog-v2/actions/workflows/deploy.yml/badge.svg?branch=main" alt="Deploy"></a>
</p>

## Develop

```bash
npm install
npm run dev          # http://localhost:4321/sandbox-4af53e-engineering-blog
npm run build
npm test             # unit tests
npm run test:e2e     # browser tests against the build
```

## Write a post

1. Add `src/content/posts/<name>.md`:

   ```yaml
   ---
   title: My Post
   slug: my-post
   date: 2026-10-01
   authors:
     - author-slug        # from src/data/authors.json
   categories:
     - Engineering
   meta_description: One sentence for search and link previews.
   ---
   ```

   Images go in `src/content/posts/images/`.

2. Add its topic in `src/data/topics.ts`.
3. Draw its card art in `src/components/PostArt.astro` and list it in `BlogThumb.astro`.
4. Capture its share image with the dev server running, then list it in `src/data/og-images.json`:

   ```bash
   npm run capture-og -- my-post
   ```

## Deploy

| Event | Result |
| --- | --- |
| Pull request | Preview link posted on the PR |
| Merge to `main` | Live on openteams.com |
